const express = require('express');
const router = express.Router();
const { idParam } = require('../middleware/validationMiddleware');
const {
  getBoxSizes, getBoxSize, createBoxSize, updateBoxSize, deleteBoxSize
} = require('../controllers/boxSizeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.param('id', idParam);
router.use(protect);
router.route('/').get(getBoxSizes).post(authorize('administrator'), createBoxSize);
router.route('/:id').get(getBoxSize).put(authorize('administrator'), updateBoxSize).delete(authorize('administrator'), deleteBoxSize);

module.exports = router;
