const express = require('express');
const router = express.Router();
const { paymentSummary, getPayments, recordPayment, vendorBalances } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { idParam } = require('../middleware/validationMiddleware');

router.param('orderId', idParam);
router.use(protect);
router.get('/', authorize('administrator'), getPayments);
router.get('/outstanding', authorize('administrator'), paymentSummary);
router.get('/vendors/balances', authorize('administrator'), vendorBalances);
router.post('/sales/:orderId', authorize('administrator', 'sales'), recordPayment);
module.exports = router;
