const mysql = require('mysql2/promise');
const { buildConfig } = require('./dbConfig');

// Serverless functions start and stop often, so keep the pool small and drop
// idle connections quickly instead of holding them open.
const pool = mysql.createPool(buildConfig({
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 5),
  maxIdle: Number(process.env.DB_POOL_SIZE || 5),
  idleTimeout: 10000,
  queueLimit: 0,
  connectTimeout: 15000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
}));

// Log connection status once at startup (does not stop the server on failure)
pool.getConnection()
  .then((connection) => {
    console.log('MySQL database connected successfully');
    connection.release();
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    console.error('Check the DB_* values in your environment variables.');
  });

module.exports = pool;
