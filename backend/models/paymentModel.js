const { pool, HttpError, money } = require('./helpers');

const METHODS = ['CASH', 'MOBILE_MONEY', 'CREDIT'];

const statusFor = (paid, total) => (paid >= total && total > 0 ? 'PAID' : paid > 0 ? 'PARTIALLY_PAID' : 'UNPAID');

/** Validate a payment request body and return normalised values. */
const parse = ({ payment_method, amount, reference_number, notes }) => {
  const method = String(payment_method || '').toUpperCase().replace(/[\s-]+/g, '_');
  const value = Number(amount ?? 0);
  if (!METHODS.includes(method)) throw new HttpError(400, 'payment_method must be CASH, MOBILE_MONEY or CREDIT.');
  if (!Number.isFinite(value) || value < 0) throw new HttpError(400, 'amount must be zero or more.');
  if (method !== 'CREDIT' && value <= 0) throw new HttpError(400, 'CASH and MOBILE_MONEY payments need an amount greater than zero.');
  if (method === 'CREDIT' && value !== 0) throw new HttpError(400, 'CREDIT means the vendor pays later, so the amount must be 0.');
  return { method, amount: money(value), reference_number: reference_number || null, notes: notes || null };
};

/**
 * Record a payment inside an existing transaction connection and refresh
 * the sale's PAID / PARTIALLY_PAID / UNPAID status.
 */
const applyPayment = async (conn, saleId, body, userId) => {
  const p = parse(body);
  const [sales] = await conn.query('SELECT * FROM sales WHERE id = ? FOR UPDATE', [saleId]);
  if (!sales.length) throw new HttpError(404, 'Sale not found.');
  if (sales[0].status === 'Cancelled') throw new HttpError(400, 'Payments cannot be recorded against a cancelled sale.');
  const total = Number(sales[0].total_amount);
  const [paidRows] = await conn.query('SELECT COALESCE(SUM(amount),0) AS paid FROM payments WHERE order_id = ?', [saleId]);
  const paid = Number(paidRows[0].paid);
  const outstanding = money(total - paid);
  if (outstanding <= 0) throw new HttpError(400, 'This sale has no outstanding balance.');
  if (p.amount > outstanding) throw new HttpError(400, `Payment exceeds the outstanding balance of ${outstanding.toFixed(2)}.`);

  await conn.query(
    'INSERT INTO payments (order_id, payment_method, amount, reference_number, notes, received_by) VALUES (?,?,?,?,?,?)',
    [saleId, p.method, p.amount, p.reference_number, p.notes, userId || null]);
  const nextPaid = money(paid + p.amount);
  const status = statusFor(nextPaid, total);
  await conn.query('UPDATE sales SET payment_status = ? WHERE id = ?', [status, saleId]);
  return { sale_id: Number(saleId), total_amount: total, amount_paid: nextPaid, outstanding_balance: Math.max(0, money(total - nextPaid)), payment_status: status, payment_method: p.method };
};

const outstandingSales = async () => (await pool.query(
  `SELECT o.id AS sale_id, o.order_number, o.order_date, o.total_amount,
          COALESCE(SUM(p.amount),0) AS amount_paid,
          GREATEST(o.total_amount - COALESCE(SUM(p.amount),0), 0) AS outstanding_balance,
          CASE WHEN COALESCE(SUM(p.amount),0) >= o.total_amount THEN 'PAID'
               WHEN COALESCE(SUM(p.amount),0) > 0 THEN 'PARTIALLY_PAID' ELSE 'UNPAID' END AS payment_status,
          sv.id AS vendor_id, sv.vendor_name, sv.business_name
   FROM sales o JOIN vendors sv ON sv.id = o.vendor_id LEFT JOIN payments p ON p.order_id = o.id
   WHERE o.status <> 'Cancelled'
   GROUP BY o.id, sv.id HAVING outstanding_balance > 0 ORDER BY o.order_date DESC`))[0];

const allPayments = async () => (await pool.query(
  `SELECT p.*, o.order_number, o.total_amount, sv.vendor_name
   FROM payments p JOIN sales o ON p.order_id = o.id JOIN vendors sv ON o.vendor_id = sv.id
   ORDER BY p.payment_date DESC, p.id DESC`))[0];

/** Outstanding balance for each vendor. all = true also lists vendors that owe nothing. */
const vendorBalances = async (all = false) => (await pool.query(
  `SELECT sv.id AS vendor_id, sv.vendor_id AS vendor_code, sv.vendor_name, sv.business_name, sv.telephone,
          COALESCE(SUM(o.total_amount),0) AS total_sales,
          COALESCE(SUM(COALESCE(px.amount_paid,0)),0) AS total_paid,
          COALESCE(SUM(GREATEST(o.total_amount - COALESCE(px.amount_paid,0), 0)),0) AS outstanding_balance
   FROM vendors sv
   LEFT JOIN sales o ON o.vendor_id = sv.id AND o.status <> 'Cancelled'
   LEFT JOIN (SELECT order_id, SUM(amount) AS amount_paid FROM payments GROUP BY order_id) px ON px.order_id = o.id
   GROUP BY sv.id ${all ? '' : 'HAVING outstanding_balance > 0'}
   ORDER BY outstanding_balance DESC, sv.vendor_name`))[0];

module.exports = { applyPayment, outstandingSales, allPayments, vendorBalances, statusFor, METHODS };
