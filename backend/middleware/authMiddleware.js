const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success:false, message:'Not authorized. Please log in.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      success:false,
      message: error.name === 'TokenExpiredError'
        ? 'Your session has expired. Please log in again.'
        : 'Not authorized. Token is invalid.'
    });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );
    if (rows.length === 0) {
      return res.status(401).json({ success:false, message:'User no longer exists.' });
    }
    if (!rows[0].is_active) {
      return res.status(401).json({ success:false, message:'User account is deactivated.' });
    }
    req.user = rows[0];
    next();
  } catch (error) {
    // Database outages are server errors, not invalid-token errors.
    next(error);
  }
};

// Restrict to specific roles (RBAC)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

module.exports = { protect, authorize };
