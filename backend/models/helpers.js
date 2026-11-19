const pool = require('../config/db');

/** Error that carries an HTTP status code to the global error handler. */
class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

/** Round a money value to 2 decimals (avoids floating point drift). */
const money = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const SIZES = ['Small', 'Medium', 'Large'];

/** Normalise "small", "SMALL " ... to "Small" (or null when invalid). */
const normaliseSize = (value) => {
  if (value === undefined || value === null) return null;
  const found = SIZES.find((s) => s.toLowerCase() === String(value).trim().toLowerCase());
  return found || null;
};

/**
 * Run work inside ONE MySQL transaction.
 *   BEGIN  -> work(connection) -> COMMIT
 * Any thrown error triggers ROLLBACK, so a multi-item purchase or sale is
 * either saved completely or not at all.
 */
const withTransaction = async (work) => {
  const connection = await pool.getConnection();
  try {
    await connection.query('BEGIN');
    const result = await work(connection);
    await connection.query('COMMIT');
    return result;
  } catch (error) {
    try { await connection.query('ROLLBACK'); } catch (_) { /* connection already gone */ }
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Resolve a request line item to a product row (fruit + packaging size).
 * Accepts either { product_id } or { fruit_id, packaging_size }.
 * lock = true adds FOR UPDATE so concurrent sales cannot oversell.
 */
const resolveProduct = async (connection, item, lock = false) => {
  const suffix = lock ? ' FOR UPDATE' : '';
  let rows;
  if (item.product_id !== undefined && item.product_id !== null && item.product_id !== '') {
    [rows] = await connection.query(
      `SELECT p.id, p.selling_price, p.is_active, f.name AS fruit_name, bs.name AS packaging_size
       FROM products p JOIN fruits f ON f.id = p.fruit_id JOIN box_sizes bs ON bs.id = p.box_size_id
       WHERE p.id = ?${suffix}`, [item.product_id]);
  } else {
    const size = normaliseSize(item.packaging_size ?? item.box_size);
    if (!item.fruit_id || !size) {
      throw new HttpError(400, 'Each item needs product_id, or fruit_id with packaging_size (Small, Medium or Large).');
    }
    [rows] = await connection.query(
      `SELECT p.id, p.selling_price, p.is_active, f.name AS fruit_name, bs.name AS packaging_size
       FROM products p JOIN fruits f ON f.id = p.fruit_id JOIN box_sizes bs ON bs.id = p.box_size_id
       WHERE p.fruit_id = ? AND bs.name = ?${suffix}`, [item.fruit_id, size]);
  }
  if (!rows.length || !rows[0].is_active) {
    throw new HttpError(400, 'Fruit / packaging size combination does not exist or is inactive.');
  }
  return rows[0];
};

const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0 && String(v).trim() !== '';

module.exports = { pool, HttpError, money, SIZES, normaliseSize, withTransaction, resolveProduct, isPositiveInt };
