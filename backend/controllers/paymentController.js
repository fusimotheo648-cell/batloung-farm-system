const Payment = require('../models/paymentModel');
const { withTransaction } = require('../models/helpers');

const paymentSummary = async (req, res, next) => {
  try { const rows = await Payment.outstandingSales(); res.status(200).json({ success: true, count: rows.length, data: rows }); } catch (e) { next(e); }
};
const getPayments = async (req, res, next) => {
  try { const rows = await Payment.allPayments(); res.status(200).json({ success: true, count: rows.length, data: rows }); } catch (e) { next(e); }
};
// POST /api/payments/sales/:orderId  { payment_method: CASH|MOBILE_MONEY|CREDIT, amount, reference_number? }
const recordPayment = async (req, res, next) => {
  try {
    const data = await withTransaction((conn) => Payment.applyPayment(conn, Number(req.params.orderId), req.body, req.user?.id));
    res.status(201).json({ success: true, message: 'Payment recorded.', data });
  } catch (e) { next(e); }
};
const vendorBalances = async (req, res, next) => {
  try { const rows = await Payment.vendorBalances(req.query.all === 'true'); res.status(200).json({ success: true, count: rows.length, data: rows }); } catch (e) { next(e); }
};

module.exports = { paymentSummary, getPayments, recordPayment, vendorBalances };
