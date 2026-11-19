const Sale = require('../models/saleModel');
const { HttpError } = require('../models/helpers');

const getOrders = async (req, res, next) => {
  try {
    const rows = await Sale.findAll(req.query);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (e) { next(e); }
};
const getOrder = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) throw new HttpError(404, 'Order not found');
    res.status(200).json({ success: true, data: sale });
  } catch (e) { next(e); }
};
// POST /api/sales (alias /api/orders): multi-item sale, auto total, stock check, all-or-nothing
const createOrder = async (req, res, next) => {
  try {
    const sale = await Sale.create(req.body, req.user?.id);
    res.status(201).json({ success: true, message: 'Sale recorded successfully', data: sale });
  } catch (e) { next(e); }
};
const updateOrder = async (req, res, next) => {
  try {
    const sale = await Sale.updateStatus(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Order updated successfully', data: sale });
  } catch (e) { next(e); }
};
const deleteOrder = async (req, res, next) => {
  try {
    await Sale.remove(req.params.id);
    res.status(200).json({ success: true, message: 'Sale deleted and any reserved stock restored.' });
  } catch (e) { next(e); }
};

module.exports = { getOrders, getOrder, createOrder, updateOrder, deleteOrder };
