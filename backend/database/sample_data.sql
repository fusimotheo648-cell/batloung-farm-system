-- =====================================================================
-- Batloung Farm - realistic sample data for ALL business tables
-- Run AFTER schema.sql:   USE batloung_farm;  SOURCE sample_data.sql;
-- (npm run seed loads this same file.)
-- Product id = (fruit_id - 1) * 3 + size, size: 1 Small, 2 Medium, 3 Large
-- =====================================================================
USE batloung_farm;

-- ---- Suppliers (one per province named in the brief) ----------------
INSERT INTO suppliers (name, province_id, contact_person, telephone, email, physical_address) VALUES
('Cape Fresh Produce',      9, 'Johan van der Berg', '+27 21 555 0101', 'johan@capefresh.co.za',      '12 Main Road, Stellenbosch, Western Cape'),
('Limpopo Fruit Co',        5, 'Grace Mokoena',      '+27 15 555 0202', 'grace@limpopofruit.co.za',   '45 Industrial Road, Polokwane, Limpopo'),
('Mpumalanga Orchards',     6, 'Pieter Botha',       '+27 13 555 0303', 'pieter@mporchards.co.za',    '8 Farm Road, Nelspruit, Mpumalanga'),
('KZN Tropical Fruits',     4, 'Sipho Dlamini',      '+27 31 555 0404', 'sipho@kzntropical.co.za',    '22 Harbour View, Durban, KwaZulu-Natal'),
('Eastern Cape Citrus',     1, 'Nomsa Nkosi',        '+27 43 555 0505', 'nomsa@eccitrus.co.za',       '5 Citrus Avenue, East London, Eastern Cape'),
('Gauteng Fresh Market',    3, 'Thando Khumalo',     '+27 11 555 0606', 'thando@gautengfresh.co.za',  '101 Market Street, Johannesburg, Gauteng'),
('Free State Orchards',     2, 'Annelie Smit',       '+27 51 555 0707', 'annelie@fsorchards.co.za',   '3 Orchard Lane, Bloemfontein, Free State'),
('North West Growers',      8, 'Kabelo Molefe',      '+27 18 555 0808', 'kabelo@nwgrowers.co.za',     '77 Farm Gate Road, Rustenburg, North West');

-- ---- Vendors (street vendors and small retailers in Maseru) ----------
INSERT INTO vendors (vendor_id, vendor_name, business_name, telephone, location, registration_date, status) VALUES
('VEN0001', 'Mamello Thabo',    'Mamello Fresh Fruits', '+266 5801 2345', 'Pitso Ground',  '2026-01-15', 'Active'),
('VEN0002', 'Thabo Mokoena',    'Maseru Fruit Stall',   '+266 5802 3456', 'Thetsane',      '2026-02-20', 'Active'),
('VEN0003', 'Palesa Nkosi',     'Palesa Fruits & Veg',  '+266 5803 4567', 'Ha Abia',       '2026-03-10', 'Active'),
('VEN0004', 'Lebohang Molefe',  'Quick Fruit',          '+266 5804 5678', 'Maseru West',   '2026-04-05', 'Active'),
('VEN0005', 'Refiloe Tau',      'Fresh Daily',          '+266 5805 6789', 'Ha Tsolo',      '2026-05-12', 'Active'),
('VEN0006', 'Neo Letsie',       'Neo Corner Shop',      '+266 5806 7890', 'Lower Thamae',  '2026-06-02', 'Active');

-- ---- Purchases (multi-item, one supplier each) ------------------------
INSERT INTO purchases (supplier_id, purchase_date, total_amount, created_by) VALUES
(1, '2026-11-01', 0, 1), (2, '2026-11-02', 0, 1), (3, '2026-11-03', 0, 1), (4, '2026-11-04', 0, 1),
(5, '2026-11-05', 0, 1), (7, '2026-11-06', 0, 1), (8, '2026-11-07', 0, 1), (6, '2026-11-07', 0, 1);

INSERT INTO purchase_details (purchase_id, product_id, quantity, unit_cost, subtotal) VALUES
-- 1 Cape Fresh: apples S/M/L
(1, 1, 60, 100.00, 60*100.00), (1, 2, 40, 190.00, 40*190.00), (1, 3, 20, 350.00, 20*350.00),
-- 2 Limpopo: bananas S/M/L + mangoes S
(2, 4, 50,  80.00, 50*80.00),  (2, 5, 40, 150.00, 40*150.00), (2, 6, 25, 270.00, 25*270.00), (2, 10, 30, 120.00, 30*120.00),
-- 3 Mpumalanga: oranges S/M/L + mangoes M
(3, 7, 40,  95.00, 40*95.00),  (3, 8, 30, 180.00, 30*180.00), (3, 9, 15, 330.00, 15*330.00), (3, 11, 20, 230.00, 20*230.00),
-- 4 KZN: mangoes L + bananas M
(4, 12, 12, 420.00, 12*420.00), (4, 5, 20, 155.00, 20*155.00),
-- 5 Eastern Cape: oranges M + grapes S
(5, 8, 20, 175.00, 20*175.00), (5, 13, 25, 140.00, 25*140.00),
-- 6 Free State: apples M + grapes M/L
(6, 2, 10, 185.00, 10*185.00), (6, 14, 15, 260.00, 15*260.00), (6, 15, 8, 480.00, 8*480.00),
-- 7 North West: apples S
(7, 1, 20, 105.00, 20*105.00),
-- 8 Gauteng: bananas S
(8, 4, 20,  85.00, 20*85.00);

-- Purchase totals are calculated from the line items.
UPDATE purchases p
JOIN (SELECT purchase_id, SUM(subtotal) AS total FROM purchase_details GROUP BY purchase_id) d ON d.purchase_id = p.id
SET p.total_amount = d.total;

-- Stock increases for every purchased fruit + packaging size.
UPDATE stock s
JOIN (SELECT product_id, SUM(quantity) AS qty FROM purchase_details GROUP BY product_id) d ON d.product_id = s.product_id
SET s.quantity_available = s.quantity_available + d.qty;

-- ---- Sales (multi-item, one vendor each) ------------------------------
INSERT INTO sales (order_number, vendor_id, order_date, total_amount, status, created_by) VALUES
('ORD2026110001', 1, '2026-11-08', 0, 'Completed',  1),
('ORD2026110002', 2, '2026-11-09', 0, 'Completed',  1),
('ORD2026110003', 3, '2026-11-10', 0, 'Completed',  1),
('ORD2026110004', 1, '2026-11-11', 0, 'Completed',  1),
('ORD2026110005', 4, '2026-11-12', 0, 'Confirmed',  1),
('ORD2026110006', 5, '2026-11-14', 0, 'Pending',    1),
('ORD2026110007', 2, '2026-11-15', 0, 'Completed',  1),
('ORD2026110008', 3, '2026-11-16', 0, 'Processing', 1);

INSERT INTO sales_details (order_id, product_id, quantity, unit_price, subtotal) VALUES
(1, 1, 5, 150.00, 5*150.00), (1, 5, 3, 220.00, 3*220.00),
(2, 4, 4, 120.00, 4*120.00), (2, 7, 2, 140.00, 2*140.00),
(3, 10, 2, 180.00, 2*180.00),
(4, 3, 8, 500.00, 8*500.00), (4, 12, 3, 620.00, 3*620.00),
(5, 8, 5, 260.00, 5*260.00), (5, 13, 4, 200.00, 4*200.00),
(6, 2, 10, 280.00, 10*280.00),
(7, 6, 5, 400.00, 5*400.00), (7, 14, 3, 380.00, 3*380.00),
(8, 3, 6, 500.00, 6*500.00);

UPDATE sales s
JOIN (SELECT order_id, SUM(subtotal) AS total FROM sales_details GROUP BY order_id) d ON d.order_id = s.id
SET s.total_amount = d.total;

-- Stock decreases for every sold fruit + packaging size.
UPDATE stock s
JOIN (SELECT product_id, SUM(quantity) AS qty FROM sales_details GROUP BY product_id) d ON d.product_id = s.product_id
SET s.quantity_available = s.quantity_available - d.qty;

-- ---- Payments: cash, mobile money and credit ---------------------------
INSERT INTO payments (order_id, payment_date, payment_method, amount, reference_number, received_by) VALUES
(1, '2026-11-08 10:00:00', 'CASH',         1410.00, NULL,          1),
(2, '2026-11-09 14:30:00', 'MOBILE_MONEY',  760.00, 'MM-DEMO-002', 1),
(3, '2026-11-10 09:15:00', 'CREDIT',          0.00, NULL,          1),
(4, '2026-11-11 16:00:00', 'CASH',         3000.00, NULL,          1),
(5, '2026-11-12 11:45:00', 'MOBILE_MONEY', 1000.00, 'MM-DEMO-005', 1),
(6, '2026-11-14 08:30:00', 'CREDIT',          0.00, NULL,          1),
(7, '2026-11-15 13:20:00', 'CASH',         3140.00, NULL,          1),
(8, '2026-11-16 15:10:00', 'MOBILE_MONEY', 1000.00, 'MM-DEMO-008', 1);

UPDATE sales s
LEFT JOIN (SELECT order_id, SUM(amount) AS paid FROM payments GROUP BY order_id) p ON p.order_id = s.id
SET s.payment_status = CASE
  WHEN COALESCE(p.paid, 0) >= s.total_amount THEN 'PAID'
  WHEN COALESCE(p.paid, 0) > 0 THEN 'PARTIALLY_PAID'
  ELSE 'UNPAID' END;
