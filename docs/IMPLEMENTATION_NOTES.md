# DIWA2110 Requirements Alignment – Implementation Notes

This revision retains the original React/Vite + Express + MySQL application and extends it for the take-home test.

## Added / corrected

- Added a multi-line purchase workflow (`POST /api/purchases`) using `purchases` + `purchase_details`.
- Each purchase validates all items, calculates the purchase total and increments each Fruit + Box Size stock record in one transaction.
- Added payment records for CASH, MOBILE_MONEY and CREDIT, with cumulative payment calculation and PAID / PARTIALLY_PAID / UNPAID states.
- Added per-vendor outstanding balance API and UI.
- Added the four exact assessment report endpoints and report buttons.
- Added `/api/sales` as an assignment-language alias for the existing orders/sales workflow.
- Sales now lock/check stock and deduct it atomically when created. Any invalid item or insufficient quantity rolls the whole transaction back.
- Cancelling a pending sale restores its stock; deleting a pending sale restores reserved stock before removal.
- Added sample multi-item purchases, sample completed sales, and sample cash/mobile-money/credit records in `seed.js`.
- Added `.env.example` and `.gitignore`; the real `.env` file is excluded from this revision.

## Database naming

The eight assignment tables are present as physical MySQL tables: `suppliers`, `fruits`, `vendors`, `purchases`, `purchase_details`, `sales`, `sales_details` and `stock`. Supporting tables (`users`, `provinces`, `box_sizes`, `products` and `payments`) provide authentication, normalized fruit/packaging pricing and payment history. Stock is keyed by `products`, and each product has a unique `(fruit_id, box_size_id)` pair, so small, medium and large balances remain separate.

## Setup

1. Install MySQL 8+ and Node.js 18+.
2. Review `backend/database/schema.sql`. It drops/recreates the `batloung_farm` database; back up any existing database first.
3. Execute the schema.
4. Copy `backend/.env.example` to `backend/.env`, then enter local database credentials and a strong unique JWT secret.
5. In `backend`, run `npm install`, `npm run seed`, then `npm run dev`.
6. In `frontend`, run `npm install`, then `npm run dev`.
7. Sign in using the seed demo credentials listed in the README. Change them before public deployment.

## Take-home test revision (models layer, packaging-aware API, tests)

- New `backend/models/` folder: every SQL query now lives in a model (`fruitModel`, `supplierModel`, `vendorModel`, `stockModel`, `purchaseModel`, `saleModel`, `paymentModel`, `reportModel`); controllers only validate input and shape the HTTP response.
- `withTransaction()` runs `BEGIN` / `COMMIT` / `ROLLBACK`; purchases, sales and payments use it.
- Purchases and sales accept `fruit_id` + `packaging_size` (or `product_id`), so the API speaks the language of the test paper.
- New endpoints: `GET /stock/low`, `GET /stock/by-packaging`, `GET /vendors/search`, supplier delete with business constraint (409), `?all=true` vendor balances.
- Required reports count every non-cancelled sale (before they only counted `Completed`, so a freshly recorded sale never appeared).
- Order numbers are now derived from the sale id (no duplicates after deletes); money is rounded to 2 decimals.
- Database failures return 503 with a clear message; `unhandledRejection` / `uncaughtException` are logged so the process never exits.
- `database/sample_data.sql` holds all sample data (8 suppliers, 6 vendors, 8 purchases, 8 sales, payments); `npm run seed` loads the same file.
- `database/transaction_demo.sql` demonstrates ROLLBACK (10 large apples requested, 6 available) and COMMIT.
- `schema.sql` now has real bcrypt hashes and the views `v_stock`, `v_purchase_details`, `v_sales_details`.

## Verification performed for this revision

- Database created from `schema.sql`, loaded with `sample_data.sql` and `seed.js` on MariaDB 10.11 (MySQL-compatible); `required_reports.sql` and `transaction_demo.sql` executed successfully.
- `npm test` (`backend/scripts/api-test.js`) ran against a live server: **57 of 57 checks passed**, covering every Part C and Part D requirement, RBAC, validation codes, the 10-vs-6 large apples rejection with unchanged stock, and wrong DB credentials (API stays up and returns a clear message).
- Frontend production build (`vite build`) succeeds and every page was opened in a headless browser.
- Not done here (needs your accounts): the live Vercel link, the GitHub push and the recorded video.
