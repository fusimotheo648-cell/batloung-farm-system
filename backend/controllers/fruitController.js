const Fruit = require('../models/fruitModel');
const { HttpError } = require('../models/helpers');

const getFruits = async (req, res, next) => {
  try {
    const rows = await Fruit.findAll(req.query);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (e) { next(e); }
};
const getFruit = async (req, res, next) => {
  try {
    const row = await Fruit.findById(req.params.id);
    if (!row) throw new HttpError(404, 'Fruit not found');
    res.status(200).json({ success: true, data: row });
  } catch (e) { next(e); }
};
const createFruit = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) throw new HttpError(400, 'Fruit name is required');
    const row = await Fruit.create(req.body);
    res.status(201).json({ success: true, message: 'Fruit created successfully', data: row });
  } catch (e) { next(e); }
};
const updateFruit = async (req, res, next) => {
  try {
    if (!(await Fruit.findById(req.params.id))) throw new HttpError(404, 'Fruit not found');
    const row = await Fruit.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Fruit updated successfully', data: row });
  } catch (e) { next(e); }
};
const deleteFruit = async (req, res, next) => {
  try {
    if (!(await Fruit.findById(req.params.id))) throw new HttpError(404, 'Fruit not found');
    await Fruit.deactivate(req.params.id); // soft delete keeps sales / purchase history intact
    res.status(200).json({ success: true, message: 'Fruit deactivated successfully' });
  } catch (e) { next(e); }
};

module.exports = { getFruits, getFruit, createFruit, updateFruit, deleteFruit };
