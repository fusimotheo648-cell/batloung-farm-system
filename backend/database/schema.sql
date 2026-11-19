-- =====================================================
-- Batloung Farm Distribution Management System
-- Database Schema - Fully compliant with assignment
-- =====================================================

DROP DATABASE IF EXISTS batloung_farm;
CREATE DATABASE batloung_farm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE batloung_farm;

-- -----------------------------------------------------
-- Table: users (for Authentication & RBAC)
-- -----------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('administrator', 'sales') NOT NULL DEFAULT 'sales',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: provinces (reference for South African provinces)
-- -----------------------------------------------------
CREATE TABLE provinces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: fruits
-- -----------------------------------------------------
CREATE TABLE fruits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: box_sizes
-- -----------------------------------------------------
CREATE TABLE box_sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE, -- Small, Medium, Large
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: products (Fruit + Box Size combination)
-- -----------------------------------------------------
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fruit_id INT NOT NULL,
    box_size_id INT NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL CHECK (selling_price > 0),
    quantity_per_box INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_product (fruit_id, box_size_id),
    FOREIGN KEY (fruit_id) REFERENCES fruits(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (box_size_id) REFERENCES box_sizes(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: suppliers
-- -----------------------------------------------------
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    province_id INT NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    physical_address TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: vendors
-- -----------------------------------------------------
CREATE TABLE vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id VARCHAR(20) NOT NULL UNIQUE, -- e.g. VEN001
    vendor_name VARCHAR(100) NOT NULL,
    business_name VARCHAR(100),
    telephone VARCHAR(20) NOT NULL,
    location VARCHAR(255) NOT NULL, -- Street / area / landmark
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    registration_date DATE NOT NULL,
    status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: purchases (Incoming stock from suppliers)
-- -----------------------------------------------------
CREATE TABLE purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    purchase_date DATE NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- One purchase can contain many fruit/packaging items.
CREATE TABLE purchase_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: stock (Current available stock - updated automatically)
-- -----------------------------------------------------
CREATE TABLE stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL UNIQUE,
    quantity_available INT NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: sales
-- -----------------------------------------------------
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    vendor_id INT NOT NULL,
    order_date DATE NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    payment_status ENUM('PAID','PARTIALLY_PAID','UNPAID') NOT NULL DEFAULT 'UNPAID',
    status ENUM('Pending', 'Confirmed', 'Processing', 'Ready for Collection/Delivery', 'Completed', 'Cancelled') 
           NOT NULL DEFAULT 'Pending',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: sales_details
-- -----------------------------------------------------
CREATE TABLE sales_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price > 0),
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal > 0),
    FOREIGN KEY (order_id) REFERENCES sales(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- A sale can be settled by one or more payments.
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method ENUM('CASH','MOBILE_MONEY','CREDIT') NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    reference_number VARCHAR(100) NULL,
    notes VARCHAR(500) NULL,
    received_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES sales(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Indexes for performance
-- -----------------------------------------------------
CREATE INDEX idx_suppliers_province ON suppliers(province_id);
CREATE INDEX idx_products_fruit ON products(fruit_id);
CREATE INDEX idx_products_boxsize ON products(box_size_id);
CREATE INDEX idx_sales_vendor ON sales(vendor_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_date ON sales(order_date);
CREATE INDEX idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX idx_purchase_details_product ON purchase_details(product_id);
CREATE INDEX idx_purchase_details_purchase ON purchase_details(purchase_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_sales_details_order ON sales_details(order_id);
CREATE INDEX idx_vendors_status ON vendors(status);

-- -----------------------------------------------------
-- Views: the relational schemas from the brief, exactly as named there.
-- products links one fruit to ONE packaging size (with its own selling
-- price), and stock/purchase/sales details point at that product, so every
-- fruit + packaging size has its own stock balance.
-- -----------------------------------------------------
CREATE VIEW v_stock AS
SELECT st.id AS stock_id, f.id AS fruit_id, f.name AS fruit_name,
       bs.name AS packaging_size, st.quantity_available
FROM stock st
JOIN products p ON p.id = st.product_id
JOIN fruits f ON f.id = p.fruit_id
JOIN box_sizes bs ON bs.id = p.box_size_id;

CREATE VIEW v_purchase_details AS
SELECT pd.id AS purchase_detail_id, pd.purchase_id, f.id AS fruit_id, f.name AS fruit_name,
       pd.quantity, pd.unit_cost, bs.name AS packaging_size
FROM purchase_details pd
JOIN products p ON p.id = pd.product_id
JOIN fruits f ON f.id = p.fruit_id
JOIN box_sizes bs ON bs.id = p.box_size_id;

CREATE VIEW v_sales_details AS
SELECT sd.id AS sales_detail_id, sd.order_id AS sale_id, f.id AS fruit_id, f.name AS fruit_name,
       bs.name AS packaging_size, sd.quantity, sd.unit_price
FROM sales_details sd
JOIN products p ON p.id = sd.product_id
JOIN fruits f ON f.id = p.fruit_id
JOIN box_sizes bs ON bs.id = p.box_size_id;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Provinces (all 9 South African provinces)
INSERT INTO provinces (name) VALUES
('Eastern Cape'),
('Free State'),
('Gauteng'),
('KwaZulu-Natal'),
('Limpopo'),
('Mpumalanga'),
('Northern Cape'),
('North West'),
('Western Cape');

-- Box Sizes
INSERT INTO box_sizes (name, description) VALUES
('Small', 'A small quantity of fruit intended for street vendors with limited capital or lower expected daily demand.'),
('Medium', 'A medium quantity suitable for street vendors with moderate customer demand.'),
('Large', 'A larger quantity intended for street vendors who purchase higher volumes.');

-- Fruits (only the five specified)
INSERT INTO fruits (name, description) VALUES
('Apples', 'Fresh apples sourced from Western Cape, Free State and Mpumalanga'),
('Bananas', 'Fresh bananas sourced from Limpopo, KwaZulu-Natal and Mpumalanga'),
('Oranges', 'Fresh oranges sourced from Limpopo, Mpumalanga and Eastern Cape'),
('Mangoes', 'Fresh mangoes sourced from Limpopo, Mpumalanga and KwaZulu-Natal'),
('Grapes', 'Fresh grapes sourced from Western Cape, Northern Cape and Limpopo');

-- Products (Fruit + Box Size combinations with sample prices in Lesotho Loti / ZAR)
INSERT INTO products (fruit_id, box_size_id, selling_price, quantity_per_box) VALUES
-- Apples
(1, 1, 150.00, 10),  -- Small
(1, 2, 280.00, 20),  -- Medium
(1, 3, 500.00, 40),  -- Large
-- Bananas
(2, 1, 120.00, 12),
(2, 2, 220.00, 25),
(2, 3, 400.00, 50),
-- Oranges
(3, 1, 140.00, 10),
(3, 2, 260.00, 20),
(3, 3, 480.00, 40),
-- Mangoes
(4, 1, 180.00, 8),
(4, 2, 340.00, 16),
(4, 3, 620.00, 30),
-- Grapes
(5, 1, 200.00, 5),
(5, 2, 380.00, 12),
(5, 3, 700.00, 25);

-- Initialize stock for all products (starting with 0 - will be updated via purchases)
INSERT INTO stock (product_id, quantity_available)
SELECT id, 0 FROM products;

-- Default users (password: admin123 and sales123 - hashed with bcrypt)
-- Real bcrypt hashes (cost 10) for 'admin123' and 'sales123'
INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'admin@batloungfruits.co.ls', '$2a$10$Xo7r1edzTcqXT3RBIsr7aez4.ZjTMJT47C5/qykFBCG/tTLlIuFaK', 'System Administrator', 'administrator'),
('sales1', 'sales@batloungfruits.co.ls', '$2a$10$UuvIix.3lBeA86Ngd8QmMOjVqFKwbwp89M/THnXEqcBlkEaQAsR4m', 'Sales Officer', 'sales');

-- Note: `npm run seed` re-creates these users and loads the sample business data.
