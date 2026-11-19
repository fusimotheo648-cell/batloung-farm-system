const express = require('express');
const router = express.Router();
const { idParam } = require('../middleware/validationMiddleware');
const {
  getFruits, getFruit, createFruit, updateFruit, deleteFruit
} = require('../controllers/fruitController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.param('id', idParam);
router.use(protect);

router.route('/')
  .get(getFruits)
  .post(authorize('administrator'), createFruit);

router.route('/:id')
  .get(getFruit)
  .put(authorize('administrator'), updateFruit)
  .delete(authorize('administrator'), deleteFruit);

module.exports = router;
