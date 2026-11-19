const Supplier = require('../models/supplierModel');
const { HttpError } = require('../models/helpers');
const { isPhone, isEmail } = require('../middleware/validationMiddleware');

const checkFields = async (d, partial = false) => {
  const required = ['name', 'province_id', 'contact_person', 'telephone', 'physical_address'];
  if (!partial) {
    const missing = required.filter((f) => !d[f] || String(d[f]).trim() === '');
    if (missing.length) throw new HttpError(400, `Missing required field(s): ${missing.join(', ')}.`);
  }
  if (d.telephone !== undefined && !isPhone(d.telephone)) throw new HttpError(400, 'Telephone number format is invalid.');
  if (d.email && !isEmail(d.email)) throw new HttpError(400, 'Email address format is invalid.');
  if (d.province_id !== undefined && !(await Supplier.provinceExists(d.province_id))) throw new HttpError(400, 'Invalid province selected');
};

const getSuppliers = async (req, res, next) => {
  try {
    const rows = await Supplier.findAll(req.query);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (e) { next(e); }
};
const getSupplier = async (req, res, next) => {
  try {
    const row = await Supplier.findById(req.params.id);
    if (!row) throw new HttpError(404, 'Supplier not found');
    res.status(200).json({ success: true, data: row });
  } catch (e) { next(e); }
};
const createSupplier = async (req, res, next) => {
  try {
    await checkFields(req.body);
    const row = await Supplier.create(req.body);
    res.status(201).json({ success: true, message: 'Supplier created successfully', data: row });
  } catch (e) { next(e); }
};
const updateSupplier = async (req, res, next) => {
  try {
    if (!(await Supplier.findById(req.params.id))) throw new HttpError(404, 'Supplier not found');
    await checkFields(req.body, true);
    const row = await Supplier.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Supplier updated successfully', data: row });
  } catch (e) { next(e); }
};

// Business constraint: a supplier with purchase history must never be erased
// (it would break purchase records and stock audit trails). Such suppliers can
// only be deactivated (PUT is_active=false); suppliers without purchases are deleted.
const deleteSupplier = async (req, res, next) => {
  try {
    if (!(await Supplier.findById(req.params.id))) throw new HttpError(404, 'Supplier not found');
    const purchases = await Supplier.countPurchases(req.params.id);
    if (purchases > 0) {
      throw new HttpError(409, `Supplier cannot be deleted because it has ${purchases} recorded purchase(s). Deactivate it instead (PUT is_active=false).`);
    }
    await Supplier.remove(req.params.id);
    res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
  } catch (e) { next(e); }
};
const getProvinces = async (req, res, next) => {
  try { res.status(200).json({ success: true, data: await Supplier.provinces() }); } catch (e) { next(e); }
};

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, getProvinces };
