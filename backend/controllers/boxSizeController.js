const pool = require('../config/db');

const ALLOWED_SIZES = ['Small', 'Medium', 'Large'];

const getBoxSizes = async (req, res, next) => {
  try {
    const { search, is_active } = req.query;
    let query = 'SELECT * FROM box_sizes WHERE 1=1';
    const params = [];
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }
    query += ' ORDER BY id ASC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) { next(error); }
};

const getBoxSize = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM box_sizes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Box size not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) { next(error); }
};

const createBoxSize = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const normalized = String(name || '').trim();
    if (!ALLOWED_SIZES.includes(normalized)) {
      return res.status(400).json({ success: false, message: 'Box size must be Small, Medium or Large' });
    }
    const [existing] = await pool.query('SELECT id FROM box_sizes WHERE name = ?', [normalized]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Box size already exists' });
    const [result] = await pool.query(
      'INSERT INTO box_sizes (name, description, is_active) VALUES (?, ?, TRUE)',
      [normalized, String(description || '').trim() || null]
    );
    const [rows] = await pool.query('SELECT * FROM box_sizes WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Box size created successfully', data: rows[0] });
  } catch (error) { next(error); }
};

const updateBoxSize = async (req, res, next) => {
  try {
    const { name, description, is_active } = req.body;
    const [existing] = await pool.query('SELECT * FROM box_sizes WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Box size not found' });

    if (name !== undefined) {
      const normalized = String(name).trim();
      if (!ALLOWED_SIZES.includes(normalized)) {
        return res.status(400).json({ success: false, message: 'Box size must be Small, Medium or Large' });
      }
      const [duplicate] = await pool.query('SELECT id FROM box_sizes WHERE name = ? AND id <> ?', [normalized, req.params.id]);
      if (duplicate.length) return res.status(409).json({ success: false, message: 'Box size already exists' });
    }

    await pool.query(
      `UPDATE box_sizes SET name = COALESCE(?, name), description = COALESCE(?, description), is_active = COALESCE(?, is_active) WHERE id = ?`,
      [name === undefined ? null : String(name).trim(), description === undefined ? null : String(description).trim(), is_active, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM box_sizes WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Box size updated successfully', data: rows[0] });
  } catch (error) { next(error); }
};

const deleteBoxSize = async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT id FROM box_sizes WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Box size not found' });
    const [products] = await pool.query('SELECT COUNT(*) AS count FROM products WHERE box_size_id = ?', [req.params.id]);
    if (products[0].count > 0) {
      await pool.query('UPDATE box_sizes SET is_active = FALSE WHERE id = ?', [req.params.id]);
      return res.json({ success: true, message: 'Box size is in use and has been deactivated' });
    }
    await pool.query('DELETE FROM box_sizes WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Box size deleted successfully' });
  } catch (error) { next(error); }
};

module.exports = { getBoxSizes, getBoxSize, createBoxSize, updateBoxSize, deleteBoxSize };
