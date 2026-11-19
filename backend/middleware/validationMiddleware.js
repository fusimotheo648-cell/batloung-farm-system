const { validationResult } = require('express-validator');
const { HttpError } = require('../models/helpers');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

/** Any :id style route parameter must be a positive whole number (else 400). */
const validateIdParams = (req, res, next) => {
  for (const [name, value] of Object.entries(req.params)) {
    if (/(^|[A-Z_])id$/i.test(name) && !/^[1-9]\d*$/.test(String(value))) {
      return next(new HttpError(400, `Invalid ${name}: "${value}". It must be a positive whole number.`));
    }
  }
  next();
};

/** router.param handler: :id / :orderId must be a positive whole number (else 400). */
const idParam = (req, res, next, value, name) => {
  if (!/^[1-9]\d*$/.test(String(value))) {
    return next(new HttpError(400, `Invalid ${name}: "${value}". It must be a positive whole number.`));
  }
  next();
};

const PHONE = /^[+()\d][\d\s()+-]{6,19}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isPhone = (v) => PHONE.test(String(v || '').trim());
const isEmail = (v) => EMAIL.test(String(v || '').trim());

const requireFields = (fields) => (req, res, next) => {
  const missing = fields.filter((f) => req.body[f] === undefined || req.body[f] === null || String(req.body[f]).trim() === '');
  if (missing.length) return next(new HttpError(400, `Missing required field(s): ${missing.join(', ')}.`));
  next();
};

module.exports = { validate, validateIdParams, idParam, requireFields, isPhone, isEmail };
