const express = require('express');
const router = express.Router();
const { idParam } = require('../middleware/validationMiddleware');
const {
  getOrders, getOrder, createOrder, updateOrder, deleteOrder
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.param('id', idParam);
router.use(protect);

router.route('/')
  .get(getOrders)
  .post(createOrder); // Admin & Sales

router.route('/:id')
  .get(getOrder)
  .put(updateOrder) // Status updates
  .delete(authorize('administrator'), deleteOrder);

module.exports = router;
