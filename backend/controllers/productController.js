const pool = require('../config/db');

// @desc    Get all products (Fruit + Box Size)
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const { fruit_id, box_size_id, search, is_active } = req.query;
    let query = `
      SELECT p.*, f.name AS fruit_name, bs.name AS box_size_name,
             CONCAT(f.name, ' - ', bs.name) AS product_name,
             s.quantity_available
      FROM products p
      JOIN fruits f ON p.fruit_id = f.id
      JOIN box_sizes bs ON p.box_size_id = bs.id
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE 1=1
    `;
    const params = [];

    if (fruit_id) {
      query += ' AND p.fruit_id = ?';
      params.push(fruit_id);
    }

    if (box_size_id) {
      query += ' AND p.box_size_id = ?';
      params.push(box_size_id);
    }

    if (search) {
      query += ' AND (f.name LIKE ? OR bs.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (is_active !== undefined) {
      query += ' AND p.is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    query += ' ORDER BY f.name, bs.name';

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, f.name AS fruit_name, bs.name AS box_size_name,
              s.quantity_available
       FROM products p
       JOIN fruits f ON p.fruit_id = f.id
       JOIN box_sizes bs ON p.box_size_id = bs.id
       LEFT JOIN stock s ON p.id = s.product_id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product (Admin)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { fruit_id, box_size_id, selling_price, quantity_per_box } = req.body;

    if (!fruit_id || !box_size_id || !selling_price || selling_price <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Fruit, box size and valid selling price are required'
      });
    }

    const [result] = await connection.query(
      `INSERT INTO products (fruit_id, box_size_id, selling_price, quantity_per_box)
       VALUES (?, ?, ?, ?)`,
      [fruit_id, box_size_id, selling_price, quantity_per_box || 1]
    );

    // Initialize stock
    await connection.query(
      'INSERT INTO stock (product_id, quantity_available) VALUES (?, 0)',
      [result.insertId]
    );

    await connection.commit();

    const [newProduct] = await pool.query(
      `SELECT p.*, f.name AS fruit_name, bs.name AS box_size_name
       FROM products p
       JOIN fruits f ON p.fruit_id = f.id
       JOIN box_sizes bs ON p.box_size_id = bs.id
       WHERE p.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct[0]
    });
  } catch (error) {
    if (connection) { try { await connection.rollback(); } catch (_) {} }
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const { selling_price, quantity_per_box, is_active } = req.body;

    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await pool.query(
      `UPDATE products SET 
        selling_price = COALESCE(?, selling_price),
        quantity_per_box = COALESCE(?, quantity_per_box),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [selling_price, quantity_per_box, is_active, req.params.id]
    );

    const [updated] = await pool.query(
      `SELECT p.*, f.name AS fruit_name, bs.name AS box_size_name
       FROM products p
       JOIN fruits f ON p.fruit_id = f.id
       JOIN box_sizes bs ON p.box_size_id = bs.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct
};
