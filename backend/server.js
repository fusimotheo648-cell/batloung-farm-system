const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const fruitRoutes = require('./routes/fruitRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const orderRoutes = require('./routes/orderRoutes');
const salesRoutes = require('./routes/salesRoutes');
const stockRoutes = require('./routes/stockRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const productRoutes = require('./routes/productRoutes');
const boxSizeRoutes = require('./routes/boxSizeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS
// FRONTEND_URL can hold one URL or several separated by commas.
// Trailing slashes are ignored so "https://app.vercel.app/" still matches.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow tools without an Origin header (curl, health checks) and listed sites
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Batloung Farm API is running',
    timestamp: new Date().toISOString()
  });
});

// Friendly message at the root URL so the deployment is easy to verify
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Batloung Farm API. Try /api/health' });
});

// Database health check: confirms the API can reach the database
app.get('/api/health/db', async (req, res) => {
  try {
    const pool = require('./config/db');
    const [rows] = await pool.query('SELECT COUNT(*) AS users FROM users');
    res.json({ status: 'OK', database: 'connected', users: rows[0].users });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', database: 'unreachable', code: error.code, message: error.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/fruits', fruitRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/products', productRoutes);
app.use('/api/box-sizes', boxSizeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// The API must never terminate because of a database failure or a stray error.
process.on('unhandledRejection', (reason) => console.error('Unhandled promise rejection (server kept running):', reason));
process.on('uncaughtException', (error) => console.error('Uncaught exception (server kept running):', error));

// Start a server only when run directly (npm start / npm run dev).
// On Vercel the app is exported and handled by api/index.js instead.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\nBatloung Farm API Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/api/health\n`);
  });
}

module.exports = app;
