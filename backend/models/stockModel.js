const { pool, SIZES } = require('./helpers');

const BASE = `FROM stock s
  JOIN products p ON s.product_id = p.id
  JOIN fruits f ON p.fruit_id = f.id
  JOIN box_sizes bs ON p.box_size_id = bs.id
  WHERE p.is_active = TRUE AND f.is_active = TRUE`;
const COLS = `s.*, p.fruit_id, p.box_size_id, p.selling_price, f.name AS fruit_name,
  bs.name AS box_size_name, bs.name AS packaging_size, CONCAT(f.name, ' - ', bs.name) AS product_name`;

const lowStockThreshold = (value) => {
  const n = Number(value ?? process.env.LOW_STOCK_THRESHOLD ?? 10);
  return Number.isFinite(n) && n >= 0 ? n : 10;
};

/** Stock quantity for every fruit AND packaging size (one row each). */
const findAll = async ({ search, low_stock, threshold } = {}) => {
  let sql = `SELECT ${COLS}, (s.quantity_available < ?) AS is_low_stock ${BASE}`;
  const limit = lowStockThreshold(threshold);
  const params = [limit];
  if (search) { sql += ' AND (f.name LIKE ? OR bs.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (low_stock === 'true') { sql += ' AND s.quantity_available < ?'; params.push(limit); }
  const [rows] = await pool.query(`${sql} ORDER BY f.name, FIELD(bs.name,'Small','Medium','Large')`, params);
  return rows;
};

/** Fruits whose stock for any packaging size is below the threshold. */
const findLow = async (threshold) => {
  const limit = lowStockThreshold(threshold);
  const [rows] = await pool.query(
    `SELECT s.id AS stock_id, f.id AS fruit_id, f.name AS fruit_name, bs.name AS packaging_size,
            s.quantity_available, ? AS threshold
     ${BASE} AND s.quantity_available < ?
     ORDER BY s.quantity_available ASC, f.name, FIELD(bs.name,'Small','Medium','Large')`, [limit, limit]);
  return { threshold: limit, rows };
};

/** One object per fruit with separate Small / Medium / Large balances. */
const byFruitPivot = async () => {
  const rows = await findAll();
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.fruit_id)) {
      map.set(r.fruit_id, { fruit_id: r.fruit_id, fruit_name: r.fruit_name, small: 0, medium: 0, large: 0, total_boxes: 0 });
    }
    const entry = map.get(r.fruit_id);
    const key = SIZES.find((s) => s === r.packaging_size)?.toLowerCase();
    if (key) { entry[key] = r.quantity_available; entry.total_boxes += r.quantity_available; }
  }
  return [...map.values()];
};

const findById = async (id) => (await pool.query(`SELECT ${COLS} ${BASE} AND s.id = ?`, [id]))[0][0];
const exists = async (id) => (await pool.query('SELECT id FROM stock WHERE id = ?', [id]))[0].length > 0;
const setQuantity = async (id, qty) => pool.query('UPDATE stock SET quantity_available = ? WHERE id = ?', [qty, id]);

module.exports = { findAll, findLow, byFruitPivot, findById, exists, setQuantity, lowStockThreshold };
