-- =====================================================================
-- DIWA2110 Part D - Required SQL reporting queries
-- A "recorded sale" is any sale that is not Cancelled.
-- =====================================================================
USE batloung_farm;

-- 1. Five most frequently sold fruits (boxes sold).
SELECT f.name AS fruit_name, SUM(sd.quantity) AS total_boxes_sold
FROM sales_details sd
JOIN products p ON p.id = sd.product_id
JOIN fruits f ON f.id = p.fruit_id
JOIN sales s ON s.id = sd.order_id
WHERE s.status <> 'Cancelled'
GROUP BY f.id, f.name
ORDER BY total_boxes_sold DESC, f.name
LIMIT 5;

-- 2. Total sales revenue generated during a specified date range.
--    Replace the two dates with the range chosen by the administrator.
SELECT COALESCE(SUM(total_amount), 0) AS total_sales_revenue, COUNT(*) AS number_of_sales
FROM sales
WHERE status <> 'Cancelled'
  AND order_date BETWEEN '2026-11-01' AND '2026-11-15';

-- 3. Vendor who has purchased the highest number of boxes.
SELECT v.vendor_name, v.business_name, SUM(sd.quantity) AS total_boxes_purchased
FROM sales s
JOIN vendors v ON v.id = s.vendor_id
JOIN sales_details sd ON sd.order_id = s.id
WHERE s.status <> 'Cancelled'
GROUP BY v.id, v.vendor_name, v.business_name
ORDER BY total_boxes_purchased DESC
LIMIT 1;

-- 4. Current stock levels for each fruit and packaging size.
SELECT f.name AS fruit_name, bs.name AS packaging_size, st.quantity_available
FROM stock st
JOIN products p ON p.id = st.product_id
JOIN fruits f ON f.id = p.fruit_id
JOIN box_sizes bs ON bs.id = p.box_size_id
ORDER BY f.name, FIELD(bs.name, 'Small', 'Medium', 'Large');

-- Bonus: outstanding balance for each vendor (Part D payment management).
SELECT v.vendor_name,
       COALESCE(SUM(s.total_amount), 0)                                   AS total_sales,
       COALESCE(SUM(px.paid), 0)                                          AS total_paid,
       COALESCE(SUM(s.total_amount - COALESCE(px.paid, 0)), 0)            AS outstanding_balance
FROM vendors v
LEFT JOIN sales s ON s.vendor_id = v.id AND s.status <> 'Cancelled'
LEFT JOIN (SELECT order_id, SUM(amount) AS paid FROM payments GROUP BY order_id) px ON px.order_id = s.id
GROUP BY v.id, v.vendor_name
ORDER BY outstanding_balance DESC;
