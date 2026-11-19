const { pool } = require('./helpers');

// "status" is the Fruits relation attribute from the test paper.
const SELECT = `SELECT f.*, CASE WHEN f.is_active THEN 'Available' ELSE 'Unavailable' END AS status FROM fruits f`;

const findAll = async ({ search, is_active } = {}) => {
  let sql = `${SELECT} WHERE 1=1`;
  const params = [];
  if (search) { sql += ' AND f.name LIKE ?'; params.push(`%${search}%`); }
  if (is_active !== undefined) { sql += ' AND f.is_active = ?'; params.push(is_active === 'true' || is_active === true ? 1 : 0); }
  const [rows] = await pool.query(`${sql} ORDER BY f.name ASC`, params);
  return rows;
};
const findById = async (id) => (await pool.query(`${SELECT} WHERE f.id = ?`, [id]))[0][0];
const create = async ({ name, description }) => {
  const [r] = await pool.query('INSERT INTO fruits (name, description) VALUES (?, ?)', [name.trim(), description || null]);
  return findById(r.insertId);
};
const update = async (id, { name, description, is_active, status }) => {
  let active = is_active;
  if (active === undefined && status !== undefined) active = String(status).toLowerCase() === 'available';
  await pool.query(
    'UPDATE fruits SET name = COALESCE(?, name), description = COALESCE(?, description), is_active = COALESCE(?, is_active) WHERE id = ?',
    [name?.trim(), description, active, id]);
  return findById(id);
};
const deactivate = async (id) => pool.query('UPDATE fruits SET is_active = FALSE WHERE id = ?', [id]);

module.exports = { findAll, findById, create, update, deactivate };
