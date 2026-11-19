const Vendor = require('../models/vendorModel');
const { HttpError } = require('../models/helpers');
const { isPhone } = require('../middleware/validationMiddleware');

const getVendors = async (req, res, next) => {
  try {
    const rows = await Vendor.findAll(req.query);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (e) { next(e); }
};
// GET /api/vendors/search?name=...  or  ?phone=...
const searchVendors = async (req, res, next) => {
  try {
    const { name, phone, q } = req.query;
    if (!name && !phone && !q) throw new HttpError(400, 'Provide a name or phone query parameter to search.');
    const rows = await Vendor.findAll({ name, phone, search: q });
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (e) { next(e); }
};
const getVendor = async (req, res, next) => {
  try {
    const row = await Vendor.findById(req.params.id);
    if (!row) throw new HttpError(404, 'Vendor not found');
    res.status(200).json({ success: true, data: row });
  } catch (e) { next(e); }
};
const createVendor = async (req, res, next) => {
  try {
    const { vendor_name, telephone, location } = req.body;
    if (!vendor_name || !telephone || !location) throw new HttpError(400, 'Vendor name, telephone and location are required');
    if (!isPhone(telephone)) throw new HttpError(400, 'Telephone number format is invalid.');
    const row = await Vendor.create(req.body);
    res.status(201).json({ success: true, message: 'Street vendor registered successfully', data: row });
  } catch (e) { next(e); }
};
const updateVendor = async (req, res, next) => {
  try {
    const existing = await Vendor.findById(req.params.id);
    if (!existing) throw new HttpError(404, 'Vendor not found');
    if (req.body.telephone !== undefined && !isPhone(req.body.telephone)) throw new HttpError(400, 'Telephone number format is invalid.');
    const row = await Vendor.update(req.params.id, req.body, existing);
    res.status(200).json({ success: true, message: 'Vendor updated successfully', data: row });
  } catch (e) { next(e); }
};
const deleteVendor = async (req, res, next) => {
  try {
    if (!(await Vendor.findById(req.params.id))) throw new HttpError(404, 'Vendor not found');
    await Vendor.deactivate(req.params.id);
    res.status(200).json({ success: true, message: 'Vendor deactivated successfully' });
  } catch (e) { next(e); }
};

module.exports = { getVendors, searchVendors, getVendor, createVendor, updateVendor, deleteVendor };
