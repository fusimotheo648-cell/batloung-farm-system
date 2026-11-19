const express = require('express');
const router = express.Router();
const {
  availableStockReport,
  salesByFruit,
  salesByBoxSize,
  salesByVendor,
  purchasesByProvince,
  pendingOrders,
  completedOrders,
  salesByDate,
  topFiveFruits,
  totalSalesForDateRange,
  topVendorByBoxes,
  stockByFruitAndPackaging
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('administrator'));
// Reports accessible by Admin (and optionally Sales for some)
router.get('/available-stock', availableStockReport);
router.get('/sales-by-fruit', salesByFruit);
router.get('/sales-by-box-size', salesByBoxSize);
router.get('/sales-by-vendor', salesByVendor);
router.get('/purchases-by-province', purchasesByProvince);
router.get('/pending-sales', pendingOrders);
router.get('/completed-sales', completedOrders);
// Aliases: the frontend Reports page calls these paths
router.get('/pending-orders', pendingOrders);
router.get('/completed-orders', completedOrders);
router.get('/sales-by-date', salesByDate);
router.get('/top-five-fruits', topFiveFruits);
router.get('/total-sales', totalSalesForDateRange);
router.get('/top-vendor-by-boxes', topVendorByBoxes);
router.get('/stock-by-packaging', stockByFruitAndPackaging);

module.exports = router;
