const { pool } = require('./helpers');

// A "recorded sale" is any sale that has not been cancelled, so revenue and
// best-seller reports match the stock that actually left the warehouse.
const ACTIVE = "o.status <> 'Cancelled'";
const q = async (sql, params = []) => (await pool.query(sql, params))[0];

/** Report 1: five most frequently sold fruits (boxes sold). */
const topFiveFruits = () => q(
  `SELECT f.id AS fruit_id, f.name AS fruit_name, SUM(sd.quantity) AS boxes_sold
   FROM sales_details sd JOIN products p ON p.id = sd.product_id
   JOIN fruits f ON f.id = p.fruit_id JOIN sales o ON o.id = sd.order_id
   WHERE ${ACTIVE} GROUP BY f.id, f.name ORDER BY boxes_sold DESC, f.name ASC LIMIT 5`);

/** Report 2: total sales revenue in a date range (inclusive). */
const revenueBetween = async (from, to) => (await q(
  `SELECT COALESCE(SUM(o.total_amount), 0) AS total_revenue, COUNT(*) AS sales_count
   FROM sales o WHERE ${ACTIVE} AND o.order_date BETWEEN ? AND ?`, [from, to]))[0];

/** Report 3: vendor who purchased the highest number of boxes. */
const topVendorByBoxes = async () => (await q(
  `SELECT sv.id AS vendor_id, sv.vendor_name, sv.business_name, SUM(sd.quantity) AS total_boxes
   FROM sales o JOIN vendors sv ON sv.id = o.vendor_id JOIN sales_details sd ON sd.order_id = o.id
   WHERE ${ACTIVE} GROUP BY sv.id, sv.vendor_name, sv.business_name ORDER BY total_boxes DESC LIMIT 1`))[0] || null;

/** Report 4: current stock level for each fruit and packaging size. */
const stockByPackaging = () => q(
  `SELECT f.name AS fruit_name, bs.name AS packaging_size, s.quantity_available, p.selling_price
   FROM stock s JOIN products p ON p.id = s.product_id JOIN fruits f ON f.id = p.fruit_id
   JOIN box_sizes bs ON bs.id = p.box_size_id ORDER BY f.name, FIELD(bs.name, 'Small', 'Medium', 'Large')`);

const availableStock = () => q(
  `SELECT f.name AS fruit, bs.name AS box_size, s.quantity_available, p.selling_price,
          (s.quantity_available * p.selling_price) AS stock_value
   FROM stock s JOIN products p ON s.product_id = p.id JOIN fruits f ON p.fruit_id = f.id
   JOIN box_sizes bs ON p.box_size_id = bs.id WHERE p.is_active = TRUE
   ORDER BY f.name, FIELD(bs.name, 'Small', 'Medium', 'Large')`);

const salesByFruit = () => q(
  `SELECT f.name AS fruit, SUM(sd.quantity) AS boxes_sold, SUM(sd.subtotal) AS total_sales
   FROM sales_details sd JOIN products p ON sd.product_id = p.id JOIN fruits f ON p.fruit_id = f.id
   JOIN sales o ON sd.order_id = o.id WHERE ${ACTIVE} GROUP BY f.id, f.name ORDER BY total_sales DESC`);

const salesByBoxSize = () => q(
  `SELECT bs.name AS box_size, SUM(sd.quantity) AS boxes_sold, SUM(sd.subtotal) AS total_sales
   FROM sales_details sd JOIN products p ON sd.product_id = p.id JOIN box_sizes bs ON p.box_size_id = bs.id
   JOIN sales o ON sd.order_id = o.id WHERE ${ACTIVE} GROUP BY bs.id, bs.name ORDER BY total_sales DESC`);

const salesByVendor = () => q(
  `SELECT sv.vendor_id, sv.vendor_name, sv.business_name, COUNT(o.id) AS total_orders, SUM(o.total_amount) AS total_sales
   FROM sales o JOIN vendors sv ON o.vendor_id = sv.id WHERE ${ACTIVE}
   GROUP BY sv.id, sv.vendor_id, sv.vendor_name, sv.business_name ORDER BY total_sales DESC`);

const purchasesByProvince = () => q(
  `SELECT p.name AS province, COUNT(DISTINCT pu.id) AS purchase_count, SUM(pd.quantity) AS total_boxes, SUM(pd.subtotal) AS total_value
   FROM purchases pu JOIN purchase_details pd ON pd.purchase_id = pu.id JOIN suppliers s ON pu.supplier_id = s.id
   JOIN provinces p ON s.province_id = p.id GROUP BY p.id, p.name ORDER BY total_value DESC`);

const byStatus = (status, direction) => q(
  `SELECT o.*, sv.vendor_name, sv.business_name FROM sales o JOIN vendors sv ON o.vendor_id = sv.id
   WHERE o.status = ? ORDER BY o.order_date ${direction}`, [status]);

const salesByDate = ({ from_date, to_date } = {}) => {
  let sql = `SELECT o.order_date, COUNT(o.id) AS order_count, SUM(o.total_amount) AS daily_sales FROM sales o WHERE ${ACTIVE}`;
  const params = [];
  if (from_date) { sql += ' AND o.order_date >= ?'; params.push(from_date); }
  if (to_date) { sql += ' AND o.order_date <= ?'; params.push(to_date); }
  return q(`${sql} GROUP BY o.order_date ORDER BY o.order_date DESC`, params);
};

module.exports = { topFiveFruits, revenueBetween, topVendorByBoxes, stockByPackaging, availableStock, salesByFruit, salesByBoxSize, salesByVendor, purchasesByProvince, byStatus, salesByDate };
