# Batloung Farm API Documentation

Base URL: `http://localhost:5000/api` (production: your Vercel API URL + `/api`)

Protected routes need the header `Authorization: Bearer <token>` (get the token from `POST /auth/login`).
Every response has `success` and either `data` or `message`.

## HTTP status codes used

| Code | Meaning in this API |
|---|---|
| 200 OK | Successful retrieval, update or delete |
| 201 Created | A record (supplier, fruit, vendor, purchase, sale, payment) was created |
| 400 Bad Request | Invalid input, missing field, bad id, **insufficient stock**, overpayment |
| 401 Unauthorized | Missing, invalid or expired token / wrong password |
| 403 Forbidden | Logged in, but the role is not allowed (RBAC) |
| 404 Not Found | The requested record does not exist |
| 409 Conflict | Business constraint, e.g. deleting a supplier that has purchases |
| 500 Internal Server Error | Unexpected server error |
| 503 Service Unavailable | Database unreachable or credentials wrong (the server keeps running) |

## Authentication
- `POST /auth/login` `{ "username": "admin", "password": "admin123" }` -> `{ success, token, user }`
- `GET /auth/me`

## Suppliers (Part C - Supplier Management)
| Method | Path | Notes |
|---|---|---|
| POST | `/suppliers` | Register (admin). Needs `name, province_id, contact_person, telephone, physical_address` |
| GET | `/suppliers` | All suppliers. Filters: `search, province, is_active` |
| GET | `/suppliers/:id` | One supplier (404 if missing) |
| PUT | `/suppliers/:id` | Update (admin) |
| DELETE | `/suppliers/:id` | Delete (admin). **409 if the supplier has purchases**; deactivate instead with `PUT { "is_active": false }` |
| GET | `/suppliers/provinces/list` | The 9 South African provinces |

## Fruits (Part C - Fruit Management)
| Method | Path | Notes |
|---|---|---|
| POST | `/fruits` | Register new fruit type (admin) `{ name, description }` |
| GET | `/fruits` | All fruits; `?is_active=true` = available fruits. Each row has `status` (Available / Unavailable) |
| PUT | `/fruits/:id` | Update name, description or `is_active` (admin) |
| DELETE | `/fruits/:id` | Deactivates the fruit (history is kept) |

## Stock by packaging size (Part C - Stock)
| Method | Path | Notes |
|---|---|---|
| GET | `/stock` | One row per **fruit + packaging size** (15 rows) with `quantity_available`. `?search=`, `?low_stock=true`, `?threshold=10` |
| GET | `/stock/by-packaging` | One object per fruit: `{ fruit_name, small, medium, large, total_boxes }` |
| GET | `/stock/low?threshold=10` | Fruits/packaging sizes with fewer boxes than the threshold (default 10, or `LOW_STOCK_THRESHOLD` in `.env`) |
| PUT | `/stock/:id` | Manual correction (admin), quantity must be a whole number >= 0 |

## Vendors (Part C - Vendor Management)
| Method | Path | Notes |
|---|---|---|
| POST | `/vendors` | Register (admin or sales). Needs `vendor_name, telephone, location` |
| GET | `/vendors` | All vendors. Filters: `search, name, phone, status, location` |
| GET | `/vendors/search?name=Mamello` or `?phone=5801` | **Search by name or phone number** |
| GET | `/vendors/:id` | One vendor |
| PUT | `/vendors/:id` | Update details |
| DELETE | `/vendors/:id` | Deactivate (admin) |

## Purchases (Part C - Purchase Management)
`POST /purchases` (admin) records ONE supplier with MANY items, calculates the total, and increases stock per fruit + packaging size, all in one transaction.

```json
{
  "supplier_id": 2,
  "purchase_date": "2026-11-19",
  "items": [
    { "fruit_id": 2, "packaging_size": "Small", "quantity": 10, "unit_cost": 80 },
    { "fruit_id": 4, "packaging_size": "Large", "quantity": 5,  "unit_cost": 420.5 }
  ]
}
```
`product_id` may be used instead of `fruit_id` + `packaging_size`. Response: `201` with `purchase_id`, `total_amount` (here 2902.50) and the saved lines.
`GET /purchases` (or `/stock/purchases`) returns purchase history (`supplier_id, province, from_date, to_date` filters).

## Sales (Part C - Sales Management)
`POST /sales` (alias `/orders`) records a sale to a registered vendor:

```json
{
  "vendor_id": 1,
  "items": [
    { "fruit_id": 2, "packaging_size": "Small", "quantity": 3 },
    { "fruit_id": 1, "packaging_size": "Large", "quantity": 2 }
  ],
  "payment_method": "CASH", "amount_paid": 500
}
```
- Unit price comes from the product's selling price for that packaging size; **the total is calculated automatically**.
- Stock is checked and locked (`SELECT ... FOR UPDATE`) per fruit + packaging size, then reduced.
- If **any** item is short (e.g. 10 large apples requested, 6 available) the response is `400` with a message like
  `Insufficient stock for Apples (Large): requested 10 box(es) but only 6 available. The whole sale was rejected and no stock was changed.`
  and the transaction is rolled back: no sale row, no details, no stock change.
- `payment_method` / `amount_paid` (optional) record a first payment in the same transaction.

Other endpoints: `GET /sales` (`search, status, payment_status, vendor_id, from_date, to_date`), `GET /sales/:id` (with items), `PUT /sales/:id` (status; cancelling restores stock), `DELETE /sales/:id` (pending/cancelled, no payments, admin).

## Payments (Part D - Advanced business logic)
- `POST /payments/sales/:saleId` `{ "payment_method": "CASH" | "MOBILE_MONEY" | "CREDIT", "amount": 500, "reference_number": "MM-1" }`
  -> sale becomes `PAID`, `PARTIALLY_PAID` or `UNPAID`. `CREDIT` means pay later (amount 0). Overpayment -> 400.
- `GET /payments` payment history (admin)
- `GET /payments/outstanding` sales with an unpaid balance (admin)
- `GET /payments/vendors/balances` outstanding balance per vendor (admin); add `?all=true` to include vendors that owe nothing

## Reports (administrator) - Part D SQL reporting
| Path | Report |
|---|---|
| `GET /reports/top-five-fruits` | Five most frequently sold fruits |
| `GET /reports/total-sales?from_date=2026-11-01&to_date=2026-11-15` | Total sales revenue in a date range (400 if dates invalid) |
| `GET /reports/top-vendor-by-boxes` | Vendor who bought the most boxes |
| `GET /reports/stock-by-packaging` | Current stock for each fruit and packaging size |
| `GET /reports/available-stock`, `sales-by-fruit`, `sales-by-box-size`, `sales-by-vendor`, `purchases-by-province`, `pending-orders`, `completed-orders`, `sales-by-date` | Dashboard reports |

A "recorded sale" in reports is every sale that is not `Cancelled`. The raw SQL is in `backend/database/required_reports.sql`.

## Other
- `GET /dashboard` public read-only summary, `GET /health`, `GET /health/db`
- Products (`/products`) and box sizes (`/box-sizes`) manage the Fruit + Small/Medium/Large price list.

## Database mapping to the test paper
`stock`, `purchase_details` and `sales_details` reference a **product** (one fruit + one packaging size, unique pair, with its own selling price). The views `v_stock`, `v_purchase_details` and `v_sales_details` show them exactly as the paper lists them (`fruit_id`, `packaging_size`, ...).
