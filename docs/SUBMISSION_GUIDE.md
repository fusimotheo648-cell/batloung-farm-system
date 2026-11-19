# DIWA2110 Take-Home Test - Submission Guide

Due **21 November 2026**. Submit: **(1) live link, (2) GitHub repository link, (3) recorded video**.

## 1. Push to GitHub (5 minutes)
```powershell
cd C:\batloung-farm-system
git init
git add .
git commit -m "Batloung Farm Distribution System - DIWA2110 take-home test"
git branch -M main
git remote add origin https://github.com/<your-username>/batloung-farm-system.git
git push -u origin main
```
Check on GitHub that **`.env` is NOT there** (only `.env.example`). `.gitignore` already excludes `.env` and `node_modules`.

## 2. Make the live link
Follow `DEPLOYMENT.md` (hosted MySQL such as TiDB Cloud + Vercel for backend and frontend). Then confirm:
- `https://<your-api>.vercel.app/api/health/db` shows `"database":"connected"`
- the frontend link opens the dashboard, and `admin / admin123` signs in
Put the **frontend** URL as the live link (also write the API URL next to it).

## 3. Record the video (about 6-8 minutes, screen + voice)
| Time | Show | Say |
|---|---|---|
| 0:00 | Frontend home page and login | System name, stack: React, Express, MySQL |
| 0:30 | MySQL client: `SHOW TABLES;` `SELECT * FROM v_stock;` | 8 core tables, stock kept per fruit **and** packaging size |
| 1:30 | VS Code folder tree | config, routes, controllers, **models**, middleware, `.env` (not hard-coded) |
| 2:15 | Suppliers: add one, search, try to delete a supplier with purchases | Business constraint, 409 message |
| 3:00 | Stock page | Small / Medium / Large rows, low-stock alert |
| 3:30 | Vendors: register, search by phone | |
| 4:00 | Purchases: 2 items from one supplier | Total calculated automatically, stock goes up |
| 4:45 | Sales: vendor orders **10 large apples** (only 6) with another item | Rejected, **nothing** saved, stock unchanged |
| 5:30 | Sales: valid multi-item sale | Total calculated, stock reduced |
| 6:00 | Payments: cash, mobile money, credit | PAID / PARTIALLY_PAID / UNPAID, balance per vendor |
| 6:45 | Reports page (4 required reports) | |
| 7:15 | Terminal: `npm test` -> 57 passed | End-to-end proof |
| 7:30 | MySQL: `SOURCE transaction_demo.sql;` | BEGIN / ROLLBACK / COMMIT |

## 4. Final checklist
- [ ] Database `batloung_farm` created with `schema.sql`, sample data loaded
- [ ] `.env` created locally from `.env.example` (real password only in `.env`)
- [ ] `npm test` passes on your machine
- [ ] GitHub link works in a private/incognito window
- [ ] Live link opens without errors on a phone or another computer
- [ ] Video plays and shows the rollback scenario
- [ ] Work is your own: be ready to explain the code (copying scores zero)
