const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');

// Public read-only dashboard. Management endpoints remain protected by RBAC.
router.get('/', getDashboardStats);

module.exports = router;
