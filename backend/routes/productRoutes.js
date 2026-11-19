const express = require('express');
const router = express.Router();
const { idParam } = require('../middleware/validationMiddleware');
const {
  getProducts, getProduct, createProduct, updateProduct
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.param('id', idParam);
router.use(protect);

router.route('/')
  .get(getProducts)
  .post(authorize('administrator'), createProduct);

router.route('/:id')
  .get(getProduct)
  .put(authorize('administrator'), updateProduct);

module.exports = router;
