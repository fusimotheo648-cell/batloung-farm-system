const { pool, HttpError, money, withTransaction, resolveProduct, isPositiveInt } = require('./helpers');

/**
 * Record a purchase from ONE supplier containing MANY fruit items.
 * Total is calculated here (sum of quantity x unit cost) and stock is
 * increased per fruit + packaging size, all inside one transaction.
 */
const create = async ({ supplier_id, purchase_date, notes, items }, userId) => {
  if (!isPositiveInt(supplier_id) || !Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'Supplier and at least one purchase item are required.');
  }
  return withTransaction(async (conn) => {
    const [suppliers] = await conn.query('SELECT id FROM suppliers WHERE id = ? AND is_active = TRUE FOR UPDATE', [supplier_id]);
    if (!suppliers.length) throw new HttpError(400, 'Supplier does not exist or is inactive.');

    let total = 0;
    const lines = [];
    for (const [index, item] of items.entries()) {
      const quantity = Number(item.quantity);
      const unitCost = Number(item.unit_cost ?? item.purchase_price);
      if (!isPositiveInt(item.quantity) || !Number.isFinite(unitCost) || unitCost < 0) {
        throw new HttpError(400, `Item ${index + 1}: quantity must be a positive whole number and unit_cost must be zero or more.`);
      }
      const product = await resolveProduct(conn, item, true);
      const subtotal = money(quantity * unitCost);
      total = money(total + subtotal);
      lines.push({ product_id: product.id, fruit_name: product.fruit_name, packaging_size: product.packaging_size, quantity, unit_cost: money(unitCost), subtotal });
    }

    const date = purchase_date || new Date().toISOString().slice(0, 10);
    const [purchase] = await conn.query(
      'INSERT INTO purchases (supplier_id, purchase_date, total_amount, notes, created_by) VALUES (?,?,?,?,?)',
      [supplier_id, date, total, notes || null, userId || null]);

    for (const line of lines) {
      await conn.query(
        'INSERT INTO purchase_details (purchase_id, product_id, quantity, unit_cost, subtotal) VALUES (?,?,?,?,?)',
        [purchase.insertId, line.product_id, line.quantity, line.unit_cost, line.subtotal]);
      const [upd] = await conn.query('UPDATE stock SET quantity_available = quantity_available + ? WHERE product_id = ?', [line.quantity, line.product_id]);
      if (!upd.affectedRows) throw new HttpError(400, `No stock record exists for ${line.fruit_name} (${line.packaging_size}).`);
    }
    return { purchase_id: purchase.insertId, supplier_id: Number(supplier_id), purchase_date: date, total_amount: total, items: lines };
  });
};

const history = async ({ supplier_id, province, from_date, to_date } = {}) => {
  let where = ' WHERE 1=1 ';
  const params = [];
  if (supplier_id) { where += ' AND pu.supplier_id = ?'; params.push(supplier_id); }
  if (province) { where += ' AND pr.name = ?'; params.push(province); }
  if (from_date) { where += ' AND pu.purchase_date >= ?'; params.push(from_date); }
  if (to_date) { where += ' AND pu.purchase_date <= ?'; params.push(to_date); }
  const [rows] = await pool.query(
    `SELECT pu.id AS purchase_id, pu.purchase_date, pu.total_amount AS purchase_total,
            s.name AS supplier_name, pr.name AS province_name, pd.id AS purchase_detail_id,
            pd.product_id, pd.quantity, pd.unit_cost, pd.unit_cost AS purchase_price, pd.subtotal,
            f.name AS fruit_name, bs.name AS box_size_name, bs.name AS packaging_size
     FROM purchases pu JOIN suppliers s ON s.id = pu.supplier_id
     JOIN provinces pr ON pr.id = s.province_id
     JOIN purchase_details pd ON pd.purchase_id = pu.id
     JOIN products p ON p.id = pd.product_id JOIN fruits f ON f.id = p.fruit_id
     JOIN box_sizes bs ON bs.id = p.box_size_id ${where}
     ORDER BY pu.purchase_date DESC, pu.id DESC, pd.id`, params);
  return rows;
};

module.exports = { create, history };
