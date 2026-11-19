const express = require('express');
const router = express.Router();
const { idParam } = require('../middleware/validationMiddleware');
const {
  getStock, getLowStock, getStockByPackaging, recordStock, updateStock, getPurchases
} = require('../controllers/stockController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.param('id', idParam);
router.use(protect);

router.get('/purchases', getPurchases);
router.get('/low', getLowStock);
router.get('/by-packaging', getStockByPackaging);

router.route('/')
  .get(getStock)
  .post(authorize('administrator'), recordStock);

router.route('/:id')
  .put(authorize('administrator'), updateStock);

module.exports = router;
