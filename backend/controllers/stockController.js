const Stock = require('../models/stockModel');
const Purchase = require('../models/purchaseModel');
const { HttpError, isPositiveInt } = require('../models/helpers');

// GET /api/stock  (?search=&low_stock=true&threshold=10)
const getStock = async (req, res, next) => {
  try {
    const rows = await Stock.findAll(req.query);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (e) { next(e); }
};
// GET /api/stock/low?threshold=10 - fruits with low stock per packaging size
const getLowStock = async (req, res, next) => {
  try {
    const { threshold, rows } = await Stock.findLow(req.query.threshold);
    res.status(200).json({ success: true, threshold, count: rows.length, data: rows });
  } catch (e) { next(e); }
};
// GET /api/stock/by-packaging - one row per fruit with small / medium / large balances
const getStockByPackaging = async (req, res, next) => {
  try {
    const rows = await Stock.byFruitPivot();
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (e) { next(e); }
};
// POST /api/stock - quick single-item purchase (wraps the multi-item purchase logic)
const recordStock = async (req, res, next) => {
  try {
    const { supplier_id, product_id, fruit_id, packaging_size, quantity, purchase_price, unit_cost, purchase_date, notes } = req.body;
    const data = await Purchase.create({
      supplier_id, purchase_date, notes,
      items: [{ product_id, fruit_id, packaging_size, quantity, unit_cost: unit_cost ?? purchase_price ?? 0 }]
    }, req.user?.id);
    const stock = await Stock.findAll({});
    const line = data.items[0];
    res.status(201).json({
      success: true, message: 'Purchase recorded and stock increased.',
      data: { ...data, stock: stock.find((s) => s.product_id === line.product_id) }
    });
  } catch (e) { next(e); }
};
const updateStock = async (req, res, next) => {
  try {
    const { quantity_available } = req.body;
    if (quantity_available === undefined || !Number.isInteger(Number(quantity_available)) || Number(quantity_available) < 0) {
      throw new HttpError(400, 'Valid quantity_available (whole number >= 0) is required');
    }
    if (!(await Stock.exists(req.params.id))) throw new HttpError(404, 'Stock record not found');
    await Stock.setQuantity(req.params.id, Number(quantity_available));
    res.status(200).json({ success: true, message: 'Stock updated successfully', data: await Stock.findById(req.params.id) });
  } catch (e) { next(e); }
};
const getPurchases = async (req, res, next) => {
  try {
    const rows = await Purchase.history(req.query);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (e) { next(e); }
};

module.exports = { getStock, getLowStock, getStockByPackaging, recordStock, updateStock, getPurchases };
