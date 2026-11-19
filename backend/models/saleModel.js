const { pool, HttpError, money, withTransaction, resolveProduct, isPositiveInt } = require('./helpers');
const { applyPayment } = require('./paymentModel');

const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Ready for Collection/Delivery', 'Completed', 'Cancelled'];

const SALE_COLUMNS = `o.*, o.id AS sale_id, o.order_date AS sale_date, sv.vendor_name, sv.business_name, sv.vendor_id AS vendor_code,
  sv.telephone AS vendor_telephone,
  COALESCE((SELECT SUM(amount) FROM payments px WHERE px.order_id = o.id), 0) AS amount_paid,
  GREATEST(o.total_amount - COALESCE((SELECT SUM(amount) FROM payments px WHERE px.order_id = o.id), 0), 0) AS outstanding_balance`;

const findAll = async ({ search, status, vendor_id, payment_status, from_date, to_date } = {}) => {
  let sql = `SELECT ${SALE_COLUMNS} FROM sales o JOIN vendors sv ON o.vendor_id = sv.id WHERE 1=1`;
  const params = [];
  if (search) {
    sql += ' AND (o.order_number LIKE ? OR sv.vendor_name LIKE ? OR sv.business_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) { sql += ' AND o.status = ?'; params.push(status); }
  if (payment_status) { sql += ' AND o.payment_status = ?'; params.push(payment_status); }
  if (vendor_id) { sql += ' AND o.vendor_id = ?'; params.push(vendor_id); }
  if (from_date) { sql += ' AND o.order_date >= ?'; params.push(from_date); }
  if (to_date) { sql += ' AND o.order_date <= ?'; params.push(to_date); }
  const [rows] = await pool.query(`${sql} ORDER BY o.created_at DESC, o.id DESC`, params);
  return rows;
};

const findItems = async (conn, saleId) => (await conn.query(
  `SELECT sd.*, sd.id AS sales_detail_id, f.id AS fruit_id, f.name AS fruit_name,
          bs.name AS box_size_name, bs.name AS packaging_size, p.selling_price
   FROM sales_details sd JOIN products p ON sd.product_id = p.id
   JOIN fruits f ON p.fruit_id = f.id JOIN box_sizes bs ON p.box_size_id = bs.id
   WHERE sd.order_id = ? ORDER BY sd.id`, [saleId]))[0];

const findById = async (id, conn = pool) => {
  const [rows] = await conn.query(`SELECT ${SALE_COLUMNS} FROM sales o JOIN vendors sv ON o.vendor_id = sv.id WHERE o.id = ?`, [id]);
  if (!rows.length) return null;
  return { ...rows[0], items: await findItems(conn, id) };
};

/**
 * Record a sale of MANY fruit items to ONE registered vendor.
 *  - total is calculated from quantity x selling price of each packaging size
 *  - every line is checked against stock for that fruit + packaging size
 *  - if ANY line fails, the whole transaction is rolled back (nothing saved,
 *    stock untouched), e.g. 10 large boxes requested but only 6 available
 */
const create = async (body, userId) => {
  const { vendor_id, order_date, sale_date, items, notes } = body;
  if (!isPositiveInt(vendor_id) || !Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'A registered vendor and at least one sale item are required.');
  }
  const wantsPayment = body.payment || (body.payment_method ? { payment_method: body.payment_method, amount: body.amount_paid, reference_number: body.reference_number } : null);

  const saleId = await withTransaction(async (conn) => {
    const [vendors] = await conn.query('SELECT id FROM vendors WHERE id = ? AND status = ? FOR UPDATE', [vendor_id, 'Active']);
    if (!vendors.length) throw new HttpError(400, 'Vendor is not registered or is not active.');

    const lines = [];
    const requested = new Map(); // product_id -> total boxes requested in this sale
    let total = 0;

    for (const [index, item] of items.entries()) {
      if (!isPositiveInt(item.quantity)) {
        throw new HttpError(400, `Item ${index + 1}: quantity must be a whole number greater than zero.`);
      }
      const quantity = Number(item.quantity);
      const product = await resolveProduct(conn, item, true);
      const [stockRows] = await conn.query('SELECT quantity_available FROM stock WHERE product_id = ? FOR UPDATE', [product.id]);
      const available = stockRows.length ? Number(stockRows[0].quantity_available) : 0;
      const totalRequested = (requested.get(product.id) || 0) + quantity;
      requested.set(product.id, totalRequested);

      if (totalRequested > available) {
        throw new HttpError(400,
          `Insufficient stock for ${product.fruit_name} (${product.packaging_size}): requested ${totalRequested} box(es) but only ${available} available. ` +
          'The whole sale was rejected and no stock was changed.');
      }
      const unitPrice = money(product.selling_price);
      const subtotal = money(unitPrice * quantity);
      total = money(total + subtotal);
      lines.push({ product_id: product.id, quantity, unit_price: unitPrice, subtotal });
    }

    const date = sale_date || order_date || new Date().toISOString().slice(0, 10);
    const [sale] = await conn.query(
      `INSERT INTO sales (order_number, vendor_id, order_date, total_amount, status, notes, created_by)
       VALUES (?, ?, ?, ?, 'Pending', ?, ?)`,
      [`T${Date.now()}${Math.random().toString(36).slice(2, 6)}`.slice(0, 20), vendor_id, date, total, notes || null, userId || null]);
    const prefix = `ORD${date.slice(0, 4)}${date.slice(5, 7)}`;
    await conn.query('UPDATE sales SET order_number = ? WHERE id = ?', [`${prefix}${String(sale.insertId).padStart(4, '0')}`, sale.insertId]);

    for (const line of lines) {
      await conn.query(
        'INSERT INTO sales_details (order_id, product_id, quantity, unit_price, subtotal) VALUES (?,?,?,?,?)',
        [sale.insertId, line.product_id, line.quantity, line.unit_price, line.subtotal]);
      const [deduct] = await conn.query(
        'UPDATE stock SET quantity_available = quantity_available - ? WHERE product_id = ? AND quantity_available >= ?',
        [line.quantity, line.product_id, line.quantity]);
      if (!deduct.affectedRows) throw new HttpError(400, 'Stock changed while saving; the whole sale was rejected.');
    }

    if (wantsPayment) await applyPayment(conn, sale.insertId, wantsPayment, userId);
    return sale.insertId;
  });
  return findById(saleId);
};

const updateStatus = async (id, { status, notes }) => withTransaction(async (conn) => {
  const [rows] = await conn.query('SELECT * FROM sales WHERE id = ? FOR UPDATE', [id]);
  if (!rows.length) throw new HttpError(404, 'Sale not found.');
  const previous = rows[0].status;
  if (status && !STATUSES.includes(status)) throw new HttpError(400, `Invalid status. Must be one of: ${STATUSES.join(', ')}`);
  if (previous === 'Completed' && status && status !== 'Completed') throw new HttpError(400, 'A completed sale cannot be reopened or cancelled.');
  if (previous === 'Cancelled' && status && status !== 'Cancelled') throw new HttpError(400, 'A cancelled sale cannot be reactivated. Create a new sale instead.');

  if (status === 'Cancelled' && previous !== 'Cancelled') {
    const [items] = await conn.query('SELECT product_id, quantity FROM sales_details WHERE order_id = ?', [id]);
    for (const item of items) {
      await conn.query('UPDATE stock SET quantity_available = quantity_available + ? WHERE product_id = ?', [item.quantity, item.product_id]);
    }
  }
  await conn.query('UPDATE sales SET status = COALESCE(?, status), notes = COALESCE(?, notes) WHERE id = ?', [status, notes, id]);
  return findById(id, conn);
});

const remove = async (id) => withTransaction(async (conn) => {
  const [rows] = await conn.query('SELECT * FROM sales WHERE id = ? FOR UPDATE', [id]);
  if (!rows.length) throw new HttpError(404, 'Sale not found.');
  if (!['Pending', 'Cancelled'].includes(rows[0].status)) throw new HttpError(400, 'Only Pending or Cancelled sales can be deleted.');
  const [pay] = await conn.query('SELECT COUNT(*) AS n FROM payments WHERE order_id = ?', [id]);
  if (Number(pay[0].n) > 0) throw new HttpError(400, 'This sale has payment history and cannot be deleted. Cancel it instead to keep the audit record.');
  if (rows[0].status === 'Pending') {
    const [items] = await conn.query('SELECT product_id, quantity FROM sales_details WHERE order_id = ?', [id]);
    for (const item of items) {
      await conn.query('UPDATE stock SET quantity_available = quantity_available + ? WHERE product_id = ?', [item.quantity, item.product_id]);
    }
  }
  await conn.query('DELETE FROM sales WHERE id = ?', [id]);
});

module.exports = { STATUSES, findAll, findById, create, updateStatus, remove };
