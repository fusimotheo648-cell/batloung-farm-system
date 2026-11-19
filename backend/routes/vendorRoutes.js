const express = require('express');
const router = express.Router();
const { idParam } = require('../middleware/validationMiddleware');
const {
  getVendors, searchVendors, getVendor, createVendor, updateVendor, deleteVendor
} = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.param('id', idParam);
router.use(protect);

router.get('/search', searchVendors);

router.route('/')
  .get(getVendors)
  .post(createVendor); // Both Admin and Sales can register vendors

router.route('/:id')
  .get(getVendor)
  .put(updateVendor)
  .delete(authorize('administrator'), deleteVendor);

module.exports = router;
