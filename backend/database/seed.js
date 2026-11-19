/**
 * Seed script for Batloung Farm
 * Run: node database/seed.js
 * Make sure MySQL is running and schema.sql has been executed first.
 */
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { buildConfig } = require('../config/dbConfig');

async function seed() {
  let connection;
  try {
    connection = await mysql.createConnection(buildConfig({ multipleStatements: true }));

    console.log('Connected to database. Seeding...');

    // Clear existing data (skipped on a brand-new cloud database)
    if (process.env.SKIP_TRUNCATE !== 'true') {
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.query('TRUNCATE TABLE payments');
      await connection.query('TRUNCATE TABLE sales_details');
      await connection.query('TRUNCATE TABLE sales');
      await connection.query('TRUNCATE TABLE purchase_details');
      await connection.query('TRUNCATE TABLE purchases');
      await connection.query('TRUNCATE TABLE stock');
      await connection.query('TRUNCATE TABLE products');
      await connection.query('TRUNCATE TABLE vendors');
      await connection.query('TRUNCATE TABLE suppliers');
      await connection.query('TRUNCATE TABLE fruits');
      await connection.query('TRUNCATE TABLE box_sizes');
      await connection.query('TRUNCATE TABLE provinces');
      await connection.query('TRUNCATE TABLE users');
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    // Users with proper bcrypt hashes
    const adminHash = await bcrypt.hash('admin123', 10);
    const salesHash = await bcrypt.hash('sales123', 10);

    await connection.query(
      `INSERT INTO users (username, email, password, full_name, role) VALUES
       ('admin', 'admin@batloungfruits.co.ls', ?, 'System Administrator', 'administrator'),
       ('sales1', 'sales@batloungfruits.co.ls', ?, 'Thabo Sales', 'sales')`,
      [adminHash, salesHash]
    );
    console.log('✓ Users created (admin/admin123, sales1/sales123)');

    // Provinces
    await connection.query(
      `INSERT INTO provinces (name) VALUES
       ('Eastern Cape'), ('Free State'), ('Gauteng'), ('KwaZulu-Natal'),
       ('Limpopo'), ('Mpumalanga'), ('Northern Cape'), ('North West'), ('Western Cape')`
    );
    console.log('✓ 9 Provinces seeded');

    // Box sizes
    await connection.query(
      `INSERT INTO box_sizes (name, description) VALUES
       ('Small', 'A small quantity of fruit intended for street vendors with limited capital or lower expected daily demand.'),
       ('Medium', 'A medium quantity suitable for street vendors with moderate customer demand.'),
       ('Large', 'A larger quantity intended for street vendors who purchase higher volumes.')`
    );
    console.log('✓ Box sizes seeded');

    // Fruits
    await connection.query(
      `INSERT INTO fruits (name, description) VALUES
       ('Apples', 'Fresh apples sourced from Western Cape, Free State and Mpumalanga'),
       ('Bananas', 'Fresh bananas sourced from Limpopo, KwaZulu-Natal and Mpumalanga'),
       ('Oranges', 'Fresh oranges sourced from Limpopo, Mpumalanga and Eastern Cape'),
       ('Mangoes', 'Fresh mangoes sourced from Limpopo, Mpumalanga and KwaZulu-Natal'),
       ('Grapes', 'Fresh grapes sourced from Western Cape, Northern Cape and Limpopo')`
    );
    console.log('✓ Fruits seeded');

    // Products
    await connection.query(
      `INSERT INTO products (fruit_id, box_size_id, selling_price, quantity_per_box) VALUES
       (1,1,150.00,10),(1,2,280.00,20),(1,3,500.00,40),
       (2,1,120.00,12),(2,2,220.00,25),(2,3,400.00,50),
       (3,1,140.00,10),(3,2,260.00,20),(3,3,480.00,40),
       (4,1,180.00,8),(4,2,340.00,16),(4,3,620.00,30),
       (5,1,200.00,5),(5,2,380.00,12),(5,3,700.00,25)`
    );
    console.log('✓ Products (Fruit + Box Size) seeded');

    // Initialize stock
    await connection.query(
      `INSERT INTO stock (product_id, quantity_available)
       SELECT id, 0 FROM products`
    );
    console.log('✓ Stock records initialized');

    // Suppliers, vendors, multi-item purchases, sales and payments live in
    // sample_data.sql so the SQL file and `npm run seed` stay identical.
    const fs = require('fs');
    const path = require('path');
    const sampleSql = fs.readFileSync(path.join(__dirname, 'sample_data.sql'), 'utf8').replace(/^\s*USE\s+[^;]*;/im, '');
    await connection.query(sampleSql);
    console.log('✓ Sample suppliers, vendors, purchases, sales and payments loaded (sample_data.sql)');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nLogin credentials:');
    console.log('  Admin  → username: admin   password: admin123');
    console.log('  Sales  → username: sales1  password: sales123');
    console.log('');

  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = seed;
if (require.main === module) seed();
