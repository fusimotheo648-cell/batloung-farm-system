# Batloung Farm Distribution Management System

> **Deploying online?** See [DEPLOYMENT.md](DEPLOYMENT.md) for the GitHub + Vercel step-by-step guide.

**DIWA2110 – Web Application Development**  
**Full-Stack Group Assignment – React + Node.js/Express + MySQL**

## 1. Overview

Batloung Farm is a database-driven distribution management system for managing fruits purchased from suppliers in the nine South African provinces and sold to street vendors in Maseru.

The application uses:

- **React 18 + Vite** for the frontend
- **Node.js + Express.js** for the REST API
- **MySQL 8+** for relational data storage
- **JWT + bcrypt** for authentication
- **Role-Based Access Control (RBAC)** for Administrator and Sales users

## 2. Assignment coverage

The implementation covers the required dashboard, fruit and product management, box-size management, supplier management, street-vendor management, stock/purchases, order management, search/filtering, reports, REST APIs, validation, authentication/authorization, relational database design, business rules and full-stack integration.

### Dashboard

- Total fruits
- Total suppliers
- Total registered vendors
- Available stock
- Total orders
- Pending orders
- Completed orders
- Sales value
- Recent orders
- Top-selling fruits
- Stock by fruit chart

### Fruit and product management

- Five required fruits: Apples, Bananas, Oranges, Mangoes and Grapes
- Add, view, edit and deactivate fruits
- Product is represented as **Fruit + Box Size**
- Small, Medium and Large box sizes
- Product selling price and quantity per box
- Search and filtering

### Box-size management

Administrators can add, view, edit, deactivate and search box sizes. The business rule restricts box sizes to **Small, Medium and Large**.

### Supplier management

- Supplier name
- South African source province
- Contact person
- Telephone
- Email
- Physical address
- Add/edit/deactivate/search/filter
- All nine South African provinces are seeded

### Street-vendor management

- Vendor ID
- Vendor name
- Business name
- Telephone
- Maseru location/area
- Registration date
- Status
- Register, view, edit and search vendors

### Stock and purchases

- Record a purchase containing multiple fruit/packaging items from one supplier.
- Calculate the purchase total from quantity × unit cost.
- Store purchase header and purchase details separately.
- Increase each matching fruit/box-size stock balance inside one MySQL transaction.
- Retain purchase history and stock by packaging size.

### Sales / order management

The `/api/sales` REST alias and existing Orders interface implement sales transactions. Orders include:

- Street vendor
- Order date
- Product/fruit
- Box size
- Quantity
- Unit price
- Subtotal
- Total order amount
- Order status

Supported statuses:

`Pending` → `Confirmed` → `Processing` → `Ready for Collection/Delivery` → `Completed`

with `Cancelled` available as a cancellation state.

### Required reports

- Available Stock Report
- Sales by Fruit
- Sales by Box Size
- Sales by Street Vendor
- Purchases by South African Province
- Pending Orders
- Completed Orders
- Total Sales by Date

## 3. Security and RBAC

The dashboard is available as the public landing page so the application opens directly at `/` without requiring a sign-in. Management pages require authentication.

| Function | Administrator | Sales |
|---|---:|---:|
| Dashboard | View | View |
| Manage suppliers | Yes | No |
| Manage fruits | Yes | No |
| Manage box sizes | Yes | No |
| Manage products | Yes | View |
| Manage stock/purchases | Yes | View |
| Register street vendors | Yes | Yes |
| Edit street vendors | Yes | Yes |
| Delete/deactivate vendors | Yes | No |
| Create orders | Yes | Yes |
| View/update orders | Yes | Yes |
| Delete orders | Yes | No |
| View reports | Yes | No |

The backend enforces permissions using JWT authentication and role authorization. Frontend permissions are for usability only; they are not relied on as the security boundary.

## 4. Business rules implemented

1. Only the five specified fruits are seeded initially.
2. Every product has a box size.
3. Available box sizes are Small, Medium and Large.
4. Every product must have a selling price greater than zero.
5. Every order belongs to a registered active street vendor.
6. Every order must contain at least one item.
7. Ordered quantity must be greater than zero.
8. A vendor cannot order more boxes than available stock.
9. Creating a sale deducts/reserves the relevant stock atomically. Cancelling an uncompleted sale restores it.
10. Cancelled orders do not reduce available stock.
11. Supplier records identify the South African source province.
12. Database primary keys, foreign keys and unique/check constraints protect data integrity.

### Payment management

- Record cash and mobile-money payments.
- Record credit as an unpaid sale.
- Allow multiple payment receipts against one sale.
- Calculate PAID, PARTIALLY_PAID and UNPAID statuses from total receipts.
- Display outstanding balances per sale and per vendor.

### Four assignment reports

1. Five most frequently sold fruits.
2. Total sales revenue for a selected date range.
3. Vendor with the highest number of boxes purchased.
4. Current stock by fruit and packaging size.

## 5. System diagrams

See:

- `docs/diagrams/system-architecture.png`
- `docs/diagrams/system-architecture.svg`
- `docs/diagrams/erd.png`
- `docs/diagrams/erd.svg`
- `docs/diagrams/use-case.md`
- `docs/SYSTEM_DESIGN.md`

## 6. Project structure

```text
batloung-farm-system/
├── backend/
│   ├── config/          db.js (mysql2 pool), dbConfig.js (.env settings)
│   ├── routes/          URL -> controller mapping (+ RBAC)
│   ├── controllers/     validate input, return HTTP status + JSON
│   ├── models/          ALL SQL queries and transactions (fruit, supplier, vendor,
│   │                    stock, purchase, sale, payment, report) + helpers.js
│   ├── middleware/      authMiddleware, validationMiddleware, errorHandler
│   ├── database/        schema.sql, sample_data.sql, required_reports.sql,
│   │                    transaction_demo.sql, seed.js, init-cloud.js
│   ├── scripts/         api-test.js (npm test)
│   ├── .env.example     copy to .env (never commit .env)
│   └── server.js
├── frontend/            React + Vite UI (fruit poster theme)
├── docs/                API_DOCUMENTATION.md, SYSTEM_DESIGN.md, diagrams/, SUBMISSION_GUIDE.md
└── README.md
```

`node_modules` and local `.env` credentials must be excluded from the submission package. Copy `.env.example` to `.env` and add your own local credentials. Run `npm install` in each application folder after extracting the project.

## 6a. DIWA2110 take-home test coverage

| Part | Requirement | Where |
|---|---|---|
| A | 8 tables, PK/FK, NOT NULL/UNIQUE/CHECK, sample data, stock per packaging size | `backend/database/schema.sql`, `sample_data.sql` |
| B | Folders for config, routes, controllers, models, middleware; mysql2; `.env`; async/await + try/catch; no crash on DB failure | `backend/` |
| C | Supplier, fruit/stock, vendor, purchase and sales APIs with 200/201/400/404/500 | `docs/API_DOCUMENTATION.md` |
| D | Auto totals, stock rules, 4 SQL reports, BEGIN/COMMIT/ROLLBACK, payments (cash, mobile money, credit; PAID / PARTIALLY_PAID / UNPAID) | `models/`, `required_reports.sql`, `transaction_demo.sql` |

Run `npm test` in `backend` (with the API running) to check every requirement automatically.

## 7. Installation

### Prerequisites

- Node.js 18 or newer
- npm
- MySQL 8 or newer

### Database setup using MySQL 8.0 Command Line Client (Windows)

You can use the **MySQL 8.0 Command Line Client** already installed on your PC; MySQL Workbench is not required.

1. Extract the project to a simple folder path, for example `C:\batloung-farm-system` (avoid spaces in the folder path).
2. Open **MySQL 8.0 Command Line Client** from the Windows Start menu and enter your MySQL root password when prompted. The `mysql>` prompt should appear.
3. Run the following command, changing the path if you extracted the project somewhere else:

```sql
SOURCE C:/batloung-farm-system/backend/database/schema.sql;
```

**Important:** `schema.sql` drops and recreates the database named `batloung_farm`. This deletes an existing database with that name and its data. Back up anything important before running it.

4. Confirm that the database and tables were created:

```sql
SHOW DATABASES;
USE batloung_farm;
SHOW TABLES;
```

You should see the `batloung_farm` database and its application tables. Type `EXIT;` to leave the MySQL client.

If you prefer to launch the client from Windows Command Prompt instead, use `mysql -u root -p`, then enter the password and run the same `SOURCE` command.

### Configure and start the backend

1. Copy `backend/.env.example` to a new file named `backend/.env`. In File Explorer, enable **View → Show → File name extensions** if Windows hides extensions, so the file does not accidentally become `.env.txt`.
2. Open `backend/.env` and set the MySQL details. For a typical local MySQL 8.0 installation using the root account, the settings may look like this (use your actual password):

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_ROOT_PASSWORD
DB_NAME=batloung_farm
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_characters
```

3. Open a new terminal in the project folder and run:

```powershell
cd backend
npm install
npm run seed
npm run dev
```

`npm run seed` inserts the sample records (from `sample_data.sql`) after the schema has been created. To load them with the MySQL client instead: `SOURCE C:/batloung-farm-system/backend/database/sample_data.sql;`. The Node.js backend connects to the same MySQL 8.0 server using the credentials in `.env`. Keep `.env` private and do not upload it to GitHub.

The API runs at:

```text
http://localhost:5000
```

### Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

The Vite application normally runs at:

```text
http://localhost:5173
```

## 8. Demo accounts

The seed script creates:

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | `admin123` |
| Sales | `sales1` | `sales123` |

Change these credentials before deploying a real system.

## 9. API

The full endpoint list is documented in `docs/API_DOCUMENTATION.md`.

All management APIs require a valid JWT. Administrator-only operations are additionally protected by the backend RBAC middleware.

## 10. Demonstration checklist

For the assignment demonstration:

1. Open `/` and show the dashboard loads directly.
2. Sign in as Administrator.
3. Demonstrate fruit CRUD/deactivation.
4. Demonstrate box-size CRUD/deactivation.
5. Demonstrate Fruit + Box Size product management.
6. Add a supplier and choose a South African province.
7. Register a street vendor.
8. Record incoming stock.
9. Create an order.
10. Demonstrate the insufficient-stock validation.
11. Update an order through its status workflow.
12. Complete an order and show the stock reduction.
13. Demonstrate the required reports.
14. Sign in as Sales and demonstrate the restricted permissions.
15. Show the ERD, architecture diagram, GitHub repository and project structure.

## 11. Documentation

- API documentation: `docs/API_DOCUMENTATION.md`
- Required Part D SQL statements: `backend/database/required_reports.sql`
- Assignment implementation notes and verification: `docs/IMPLEMENTATION_NOTES.md`
- System design and RBAC: `docs/SYSTEM_DESIGN.md`
- ERD: `docs/diagrams/erd.png`
- Architecture: `docs/diagrams/system-architecture.png`
- Use cases: `docs/diagrams/use-case.md`

## 12. GitHub submission

Create a GitHub repository for the project and push the project without `node_modules` or local `.env` credentials. Add the repository URL to the Moodle submission field as required by the course.


## Google Maps for Street Vendors

The Street Vendors form now includes a Google Maps preview based on the address/area entered, a link to open that search in Google Maps, and optional latitude/longitude fields for an exact pin. Vendor records with coordinates show a **View map** link in the vendors table.

**Database update for existing installations:** run this once against your existing `batloung_farm` database:

```sql
ALTER TABLE vendors
  MODIFY location VARCHAR(255) NOT NULL,
  ADD COLUMN latitude DECIMAL(10,7) NULL,
  ADD COLUMN longitude DECIMAL(10,7) NULL;
```

If you create the database from scratch using `backend/database/schema.sql`, these columns are already included. This uses Google Maps' public search/embed URLs and does not require a Google Maps API key. The preview is a search preview; to save an exact pin, enter coordinates obtained from Google Maps.


## Vendor distance and travel-time search

The Street Vendors tab includes live search and sorting by nearest/farthest distance or shortest/longest travel time. Select **Use my location** to request browser GPS permission, or enter a starting address/area/landmark and choose **Set starting place**. Vendor records need valid latitude and longitude values for distance/time calculations; add or edit a vendor and pin the exact location on the map when necessary.

- **Distance:** calculated from the starting point to the vendor using the Haversine formula (straight-line distance, not road distance).
- **Driving time:** requested from the public OSRM routing service and may be unavailable if the service is offline or rate-limited.
- **Walking time:** an approximate estimate based on a 4.5 km/h walking speed and straight-line distance; it is not a pedestrian route.
- **Geocoding:** manual starting places are looked up with OpenStreetMap Nominatim. Use these public services respectfully; they have usage limits and are not guaranteed production SLAs.

No Google Maps API key is required for this implementation. For a production deployment, use a supported paid/contracted routing and geocoding provider, follow its terms and rate limits, and keep any private API keys on the backend rather than exposing them in frontend source. The browser geolocation API normally requires HTTPS (localhost is allowed for development).


The assignment-specific multi-item purchase and payment workflows are documented in `docs/API_DOCUMENTATION.md`. The schema includes physical tables for Vendors, Sales and Sales Details and the original frontend calls are routed to these physical tables.
