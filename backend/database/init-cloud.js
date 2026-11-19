/**
 * One-command database setup for a hosted MySQL / TiDB database.
 *   1. creates the database if needed
 *   2. creates all tables from schema.sql
 *   3. loads the sample data and the admin / sales logins
 *
 * Run once from the backend folder with the DB_* variables set (see .env.example):
 *   npm run db:setup
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { buildConfig } = require('../config/dbConfig');
const seed = require('./seed');

async function main() {
  const dbName = process.env.DB_NAME || 'batloung_farm';
  const admin = await mysql.createConnection(buildConfig({ database: undefined, multipleStatements: true }));
  console.log(`Connected to ${process.env.DB_HOST || 'localhost'}`);

  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.query(`USE \`${dbName}\``);

  const [existing] = await admin.query(
    'SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
    [dbName, 'users']
  );

  if (existing[0].n > 0 && process.env.FORCE_RESET !== 'true') {
    await admin.end();
    console.log('The database is already set up, so nothing was changed and no data was touched.');
    console.log('(To wipe it and start over with the sample data, run with FORCE_RESET=true.)');
    return;
  } else {
    // The schema file drops/creates/selects "batloung_farm" itself. A hosted
    // database already has its own name, so those three statements are removed.
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
      .replace(/^\s*DROP DATABASE[^;]*;/im, '')
      .replace(/^\s*CREATE DATABASE[^;]*;/im, '')
      .replace(/^\s*USE\s+[^;]*;/im, '');
    // Keep only the table definitions. Sample data and the real password
    // hashes are inserted by seed.js, so everything from the first INSERT on is dropped.
    const tablesOnly = sql.slice(0, sql.search(/^\s*INSERT INTO/im) === -1 ? undefined : sql.search(/^\s*INSERT INTO/im));

    if (process.env.FORCE_RESET === 'true') {
      await admin.query('SET FOREIGN_KEY_CHECKS = 0');
      const [tables] = await admin.query('SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ?', [dbName]);
      for (const t of tables) await admin.query(`DROP TABLE IF EXISTS \`${t.name}\``);
      await admin.query('SET FOREIGN_KEY_CHECKS = 1');
    }
    await admin.query(tablesOnly);
    console.log('Tables created.');
    process.env.SKIP_TRUNCATE = 'true';
  }
  await admin.end();

  if (process.env.SKIP_SEED === 'true') return console.log('SKIP_SEED=true, sample data not loaded.');
  await seed();
}

main().catch((error) => {
  console.error('Setup failed:', error.message);
  process.exit(1);
});
