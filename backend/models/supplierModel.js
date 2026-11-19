const { pool } = require('./helpers');

const SELECT = `SELECT s.*, p.name AS province_name, p.name AS province
                FROM suppliers s JOIN provinces p ON s.province_id = p.id`;

const findAll = async ({ search, province, is_active } = {}) => {
  let sql = `${SELECT} WHERE 1=1`;
  const params = [];
  if (search) {
    sql += ' AND (s.name LIKE ? OR s.contact_person LIKE ? OR s.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (province) { sql += ' AND p.name = ?'; params.push(province); }
  if (is_active !== undefined) { sql += ' AND s.is_active = ?'; params.push(is_active === 'true' ? 1 : 0); }
  const [rows] = await pool.query(`${sql} ORDER BY s.name ASC`, params);
  return rows;
};
const findById = async (id) => (await pool.query(`${SELECT} WHERE s.id = ?`, [id]))[0][0];
const provinceExists = async (id) => (await pool.query('SELECT id FROM provinces WHERE id = ?', [id]))[0].length > 0;
const create = async (d) => {
  const [r] = await pool.query(
    `INSERT INTO suppliers (name, province_id, contact_person, telephone, email, physical_address) VALUES (?,?,?,?,?,?)`,
    [d.name.trim(), d.province_id, d.contact_person.trim(), d.telephone.trim(), d.email?.trim() || null, d.physical_address.trim()]);
  return findById(r.insertId);
};
const update = async (id, d) => {
  await pool.query(
    `UPDATE suppliers SET name = COALESCE(?, name), province_id = COALESCE(?, province_id),
       contact_person = COALESCE(?, contact_person), telephone = COALESCE(?, telephone),
       email = COALESCE(?, email), physical_address = COALESCE(?, physical_address),
       is_active = COALESCE(?, is_active) WHERE id = ?`,
    [d.name?.trim(), d.province_id, d.contact_person?.trim(), d.telephone?.trim(), d.email?.trim(), d.physical_address?.trim(), d.is_active, id]);
  return findById(id);
};
const countPurchases = async (id) => Number((await pool.query('SELECT COUNT(*) AS n FROM purchases WHERE supplier_id = ?', [id]))[0][0].n);
const remove = async (id) => pool.query('DELETE FROM suppliers WHERE id = ?', [id]);
const deactivate = async (id) => pool.query('UPDATE suppliers SET is_active = FALSE WHERE id = ?', [id]);
const provinces = async () => (await pool.query('SELECT * FROM provinces ORDER BY name ASC'))[0];

module.exports = { findAll, findById, provinceExists, create, update, countPurchases, remove, deactivate, provinces };
