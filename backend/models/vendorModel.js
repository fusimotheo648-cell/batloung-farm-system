const { pool } = require('./helpers');

const generateVendorId = async (conn = pool) => {
  const [rows] = await conn.query("SELECT COALESCE(MAX(CAST(SUBSTRING(vendor_id, 4) AS UNSIGNED)), 0) AS n FROM vendors");
  return `VEN${String(Number(rows[0].n) + 1).padStart(4, '0')}`;
};

const findAll = async ({ search, name, phone, status, location } = {}) => {
  let sql = 'SELECT * FROM vendors WHERE 1=1';
  const params = [];
  if (search) {
    sql += ' AND (vendor_name LIKE ? OR business_name LIKE ? OR vendor_id LIKE ? OR telephone LIKE ? OR location LIKE ?)';
    params.push(...Array(5).fill(`%${search}%`));
  }
  if (name) { sql += ' AND (vendor_name LIKE ? OR business_name LIKE ?)'; params.push(`%${name}%`, `%${name}%`); }
  if (phone) { sql += ' AND REPLACE(telephone, " ", "") LIKE ?'; params.push(`%${String(phone).replace(/\s+/g, '')}%`); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (location) { sql += ' AND location LIKE ?'; params.push(`%${location}%`); }
  const [rows] = await pool.query(`${sql} ORDER BY registration_date DESC, id DESC`, params);
  return rows;
};
const findById = async (id) => (await pool.query('SELECT * FROM vendors WHERE id = ?', [id]))[0][0];
const toNum = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
const create = async (d) => {
  const vendorId = await generateVendorId();
  const [r] = await pool.query(
    `INSERT INTO vendors (vendor_id, vendor_name, business_name, telephone, location, latitude, longitude, registration_date, status)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [vendorId, d.vendor_name.trim(), d.business_name?.trim() || null, d.telephone.trim(), d.location.trim(),
     toNum(d.latitude), toNum(d.longitude), d.registration_date || new Date().toISOString().slice(0, 10), d.status || 'Active']);
  return findById(r.insertId);
};
const update = async (id, d, existing) => {
  await pool.query(
    `UPDATE vendors SET vendor_name = COALESCE(?, vendor_name), business_name = COALESCE(?, business_name),
       telephone = COALESCE(?, telephone), location = COALESCE(?, location), latitude = ?, longitude = ?,
       status = COALESCE(?, status) WHERE id = ?`,
    [d.vendor_name?.trim(), d.business_name?.trim(), d.telephone?.trim(), d.location?.trim(),
     d.latitude === undefined ? existing.latitude : toNum(d.latitude),
     d.longitude === undefined ? existing.longitude : toNum(d.longitude), d.status, id]);
  return findById(id);
};
const deactivate = async (id) => pool.query("UPDATE vendors SET status = 'Inactive' WHERE id = ?", [id]);

module.exports = { findAll, findById, create, update, deactivate };
