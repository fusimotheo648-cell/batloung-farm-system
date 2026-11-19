const Purchase = require('../models/purchaseModel');

// POST /api/purchases
// { supplier_id, purchase_date?, notes?, items:[{ fruit_id, packaging_size, quantity, unit_cost } | { product_id, ... }] }
const createPurchase = async (req, res, next) => {
  try {
    const data = await Purchase.create(req.body, req.user?.id);
    res.status(201).json({ success: true, message: 'Purchase recorded and stock updated.', data });
  } catch (e) { next(e); }
};
const getPurchases = async (req, res, next) => {
  try {
    const rows = await Purchase.history(req.query);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (e) { next(e); }
};

module.exports = { createPurchase, getPurchases };
