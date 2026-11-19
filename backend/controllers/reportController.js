const Report = require('../models/reportModel');
const { HttpError } = require('../models/helpers');

const send = (name, fn) => async (req, res, next) => {
  try {
    const data = await fn(req);
    res.status(200).json({ success: true, report: name, count: Array.isArray(data) ? data.length : undefined, data });
  } catch (e) { next(e); }
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

module.exports = {
  availableStockReport: send('Available Stock', () => Report.availableStock()),
  salesByFruit: send('Sales by Fruit', () => Report.salesByFruit()),
  salesByBoxSize: send('Sales by Box Size', () => Report.salesByBoxSize()),
  salesByVendor: send('Sales by Street Vendor', () => Report.salesByVendor()),
  purchasesByProvince: send('Purchases by Province', () => Report.purchasesByProvince()),
  pendingOrders: send('Pending Orders', () => Report.byStatus('Pending', 'ASC')),
  completedOrders: send('Completed Orders', () => Report.byStatus('Completed', 'DESC')),
  salesByDate: send('Total Sales by Date', (req) => Report.salesByDate(req.query)),
  topFiveFruits: send('Five Most Frequently Sold Fruits', () => Report.topFiveFruits()),
  totalSalesForDateRange: async (req, res, next) => {
    try {
      const { from_date, to_date } = req.query;
      if (!DATE.test(from_date || '') || !DATE.test(to_date || '') || from_date > to_date) {
        throw new HttpError(400, 'Valid from_date and to_date (YYYY-MM-DD, from <= to) are required.');
      }
      res.status(200).json({ success: true, report: 'Total Sales Revenue', from_date, to_date, data: await Report.revenueBetween(from_date, to_date) });
    } catch (e) { next(e); }
  },
  topVendorByBoxes: send('Vendor With Highest Boxes Purchased', () => Report.topVendorByBoxes()),
  stockByFruitAndPackaging: send('Current Stock by Fruit and Packaging Size', () => Report.stockByPackaging())
};
