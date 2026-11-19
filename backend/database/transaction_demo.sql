-- =====================================================================
-- DIWA2110 Part D - MySQL transactions with BEGIN / COMMIT / ROLLBACK
-- Run in the MySQL command line:  SOURCE transaction_demo.sql;
-- Scenario: vendor VEN0004 orders 2 items in ONE sale.
--   Test A: item 2 asks for 10 LARGE apples, only 6 exist  -> ROLLBACK
--   Test B: both items are available                         -> COMMIT
-- =====================================================================
USE batloung_farm;

SELECT 'STOCK BEFORE' AS step;
SELECT f.name AS fruit, bs.name AS size, st.quantity_available
FROM stock st JOIN products p ON p.id = st.product_id JOIN fruits f ON f.id = p.fruit_id JOIN box_sizes bs ON bs.id = p.box_size_id
WHERE (f.name = 'Bananas' AND bs.name = 'Small') OR (f.name = 'Apples' AND bs.name = 'Large');

-- ---------- Test A: one item fails validation -> everything is undone ----------
START TRANSACTION;                                   -- BEGIN

INSERT INTO sales (order_number, vendor_id, order_date, total_amount, status)
VALUES ('TXN-DEMO-A', 4, CURDATE(), 0, 'Pending');
SET @sale = LAST_INSERT_ID();

-- Item 1: 2 small bananas (available) -> saved and stock reduced
INSERT INTO sales_details (order_id, product_id, quantity, unit_price, subtotal) VALUES (@sale, 4, 2, 120.00, 240.00);
UPDATE stock SET quantity_available = quantity_available - 2 WHERE product_id = 4 AND quantity_available >= 2;
SELECT ROW_COUNT() AS item1_rows_updated;            -- 1 = ok

-- Item 2: 10 large apples but only 6 available -> the guarded UPDATE changes 0 rows
UPDATE stock SET quantity_available = quantity_available - 10 WHERE product_id = 3 AND quantity_available >= 10;
SELECT ROW_COUNT() AS item2_rows_updated;            -- 0 = INSUFFICIENT STOCK

ROLLBACK;                                            -- undo item 1, the sale header and the details

SELECT 'AFTER ROLLBACK (stock identical, no TXN-DEMO-A sale)' AS step;
SELECT COUNT(*) AS demo_sales_saved FROM sales WHERE order_number = 'TXN-DEMO-A';
SELECT f.name AS fruit, bs.name AS size, st.quantity_available
FROM stock st JOIN products p ON p.id = st.product_id JOIN fruits f ON f.id = p.fruit_id JOIN box_sizes bs ON bs.id = p.box_size_id
WHERE (f.name = 'Bananas' AND bs.name = 'Small') OR (f.name = 'Apples' AND bs.name = 'Large');

-- ---------- Test B: every item passes -> COMMIT ----------
START TRANSACTION;
INSERT INTO sales (order_number, vendor_id, order_date, total_amount, status)
VALUES ('TXN-DEMO-B', 4, CURDATE(), 0, 'Pending');
SET @sale = LAST_INSERT_ID();
INSERT INTO sales_details (order_id, product_id, quantity, unit_price, subtotal) VALUES
  (@sale, 4, 2, 120.00, 240.00),   -- 2 small bananas
  (@sale, 3, 1, 500.00, 500.00);   -- 1 large apple
UPDATE stock SET quantity_available = quantity_available - 2 WHERE product_id = 4 AND quantity_available >= 2;
UPDATE stock SET quantity_available = quantity_available - 1 WHERE product_id = 3 AND quantity_available >= 1;
UPDATE sales SET total_amount = (SELECT SUM(subtotal) FROM sales_details WHERE order_id = @sale) WHERE id = @sale;
COMMIT;

SELECT 'AFTER COMMIT (stock reduced, sale saved)' AS step;
SELECT order_number, total_amount FROM sales WHERE order_number = 'TXN-DEMO-B';
SELECT f.name AS fruit, bs.name AS size, st.quantity_available
FROM stock st JOIN products p ON p.id = st.product_id JOIN fruits f ON f.id = p.fruit_id JOIN box_sizes bs ON bs.id = p.box_size_id
WHERE (f.name = 'Bananas' AND bs.name = 'Small') OR (f.name = 'Apples' AND bs.name = 'Large');

-- Clean up Test B so the demo can be re-run (optional)
-- UPDATE stock SET quantity_available = quantity_available + 2 WHERE product_id = 4;
-- UPDATE stock SET quantity_available = quantity_available + 1 WHERE product_id = 3;
-- DELETE FROM sales WHERE order_number = 'TXN-DEMO-B';
