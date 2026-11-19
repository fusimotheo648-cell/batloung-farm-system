# Batloung Farm – System Design and Assignment Evidence

## 1. System architecture

The system uses a three-layer full-stack design:

1. **React frontend** – user interface, routing, forms, validation feedback, charts and tables.
2. **Node.js/Express backend** – REST API, authentication, authorization, server-side validation and business rules.
3. **MySQL database** – relational storage with primary keys, foreign keys and integrity constraints.

See `diagrams/system-architecture.png` and `diagrams/system-architecture.svg`.

## 2. Entity Relationship Diagram

The ERD represents the database relationships required by the assignment. See `diagrams/erd.png` and `diagrams/erd.svg`.

Key relationships include:

- Province → Suppliers
- Fruit → Products
- Box Size → Products
- Supplier → Purchases
- Product → Purchases
- Product → Stock
- Street Vendor → Orders
- User → Orders
- Order → Order Items
- Product → Order Items

## 3. Role-based access control

| Function | Administrator | Sales |
|---|---|---|
| Dashboard | View | View |
| Manage suppliers | Yes | No |
| Manage fruits | Yes | No |
| Manage box sizes | Yes | No |
| Manage products | Yes | View |
| Manage stock/purchases | Yes | View |
| Register vendors | Yes | Yes |
| Edit vendors | Yes | Yes |
| Delete/deactivate vendors | Yes | No |
| Create orders | Yes | Yes |
| View/update orders | Yes | Yes |
| Delete orders | Yes | No |
| View reports | Yes | No |

The backend enforces the sensitive permissions; frontend controls are only for usability and do not replace server-side authorization.

## 4. Business rules

- Only Apples, Bananas, Oranges, Mangoes and Grapes are seeded as the initial saleable fruits.
- Every product is a Fruit + Box Size combination.
- Box sizes are Small, Medium and Large.
- Selling price must be greater than zero.
- Orders must belong to registered active vendors.
- Orders must contain at least one item.
- Order quantity must be greater than zero.
- A vendor cannot order more boxes than available stock.
- Creating a sale deducts stock atomically; cancelling a pending sale restores the reserved stock.
- Cancelling an order does not reduce stock.
- Supplier records identify the South African province of source.

## 5. Demonstration checklist

For the practical demonstration, show these flows:

1. Open the public dashboard without signing in.
2. Sign in as Administrator.
3. Add/edit/deactivate a fruit.
4. Add/edit/deactivate a box size.
5. Add/edit a Fruit + Box Size product and selling price.
6. Add a supplier and select a South African province.
7. Register a street vendor.
8. Record a multi-item purchase and verify the total and stock increase.
9. Create an order as a Sales user or Administrator.
10. Attempt to order more boxes than stock to demonstrate validation.
11. Move an order through its status workflow.
12. Complete an order and show stock reduction.
13. Open the reports and demonstrate the required reports.
14. Show the GitHub repository and explain the system architecture/ERD.


## 6. Mapping to the DIWA2110 relational schema

The database uses the assignment's physical table names for `vendors`, `sales` and `sales_details`; the React interface and API retain familiar vendor/order labels where helpful.

| Test terminology | Physical table | Notes |
|---|---|---|
| Suppliers | `suppliers` | Supplier records and province foreign key |
| Fruits | `fruits` | Fruit catalogue |
| Vendors | `vendors` | Vendor name, phone, location and registration date |
| Purchases | `purchases` | Purchase header and calculated total |
| Purchase Details | `purchase_details` | One row per fruit/packaging purchase line |
| Sales | `sales` | Sale header, total and payment status |
| Sales Details | `sales_details` | One row per fruit/packaging sale line |
| Stock | `stock` | One balance per Fruit + Box Size product |

`products` is the normalized Fruit + Box Size + selling price association. Its unique `(fruit_id, box_size_id)` key means every stock row is packaging-specific. `payments` is an additional table supporting multiple receipts per sale.

## 7. Purchase transaction

`POST /api/purchases` accepts a supplier and an array of line items. The controller validates every item, calculates each subtotal and the overall total, inserts one purchase header plus all purchase details, and increments the matching stock rows. All writes occur in one MySQL transaction. Any invalid item or failed write causes ROLLBACK.

## 8. Sales transaction and stock reservation

`POST /api/sales` (also available as `/api/orders` for the existing frontend) validates the active vendor and every product/quantity, locks stock rows with `SELECT ... FOR UPDATE`, calculates the sale total from stored selling prices, inserts the sale and its details, and deducts all stock in the same transaction. If any item is invalid or stock is insufficient, the entire operation rolls back. Cancelling a pending sale restores its reserved stock; a completed sale cannot be reopened.

## 9. Payments and balances

Payments are stored separately and may be recorded more than once against a sale. `CASH` and `MOBILE_MONEY` require a positive amount. `CREDIT` is recorded with amount zero, leaving the full amount outstanding. The API calculates the cumulative paid amount, outstanding amount and one of `PAID`, `PARTIALLY_PAID` or `UNPAID`. Vendor balances aggregate all outstanding sale balances.

## 10. Required report SQL

The report controller provides:
1. Five most frequently sold fruits (SUM of sales detail quantities, cancelled sales excluded).
2. Total revenue between required `from_date` and `to_date`.
3. Vendor with the largest box quantity (cancelled sales excluded).
4. Current stock by fruit and packaging size.

## 11. Demonstration and test cases

- Purchase multiple product/packaging items from one supplier; verify the header total and every stock increment.
- Submit a purchase with an invalid second item; verify no header, details or stock changes remain.
- Sell multiple items; verify server-calculated total and stock deductions.
- Request more stock than available for one line; verify no sale/detail rows are committed and all stock remains unchanged.
- Cancel a pending sale; verify stock is restored once.
- Record partial cash/mobile-money payments and verify `PARTIALLY_PAID`.
- Record a full payment and verify `PAID`.
- Record credit with zero received and verify `UNPAID`.
- Run each of the four required report endpoints.
