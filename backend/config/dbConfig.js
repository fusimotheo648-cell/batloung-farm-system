require('dotenv').config();

// One place for the MySQL connection settings, used by the API, the seed
// script and the cloud setup script. Works locally and with a cloud database
// (TiDB Cloud, PlanetScale-style hosts, etc.) when DB_SSL=true.
const buildConfig = (extra = {}) => {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    port: Number(process.env.DB_PORT || 3306),
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'batloung_farm',
    ...extra
  };

  if (String(process.env.DB_SSL).toLowerCase() === 'true') {
    config.ssl = {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: String(process.env.DB_SSL_STRICT).toLowerCase() !== 'false'
    };
  }
  return config;
};

module.exports = { buildConfig };
