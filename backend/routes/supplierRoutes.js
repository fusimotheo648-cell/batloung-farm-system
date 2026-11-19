const express = require('express');
const router = express.Router();
const { idParam } = require('../middleware/validationMiddleware');
const {
  getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, getProvinces
} = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.param('id', idParam);
router.use(protect);

router.get('/provinces/list', getProvinces);

router.route('/')
  .get(getSuppliers)
  .post(authorize('administrator'), createSupplier);

router.route('/:id')
  .get(getSupplier)
  .put(authorize('administrator'), updateSupplier)
  .delete(authorize('administrator'), deleteSupplier);

module.exports = router;
