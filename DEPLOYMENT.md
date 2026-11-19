# Deploy Batloung Farm online (GitHub + Vercel)

You will end up with three things online:

| Part | Where it lives | Result |
|---|---|---|
| Database (MySQL) | TiDB Cloud Starter (free, MySQL-compatible) | stores all data |
| Backend (Express API) | Vercel project #1, root folder `backend` | `https://<backend>.vercel.app` |
| Frontend (React) | Vercel project #2, root folder `frontend` | `https://<frontend>.vercel.app` |

Vercel does not host databases, which is why the database is a separate free service.
Follow the steps **in this order**. Total time: about 20 minutes.

---

## Step 1. Put the project on GitHub

1. On github.com click **New repository**, name it `batloung-farm-system`, leave it empty, click **Create**.
2. In a terminal, from the folder that contains `backend`, `frontend` and this file:

```bash
git init
git add .
git commit -m "Batloung Farm system"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/batloung-farm-system.git
git push -u origin main
```

`node_modules`, `dist` and `.env` files are ignored automatically, so no passwords are uploaded.

---

## Step 2. Create the online database

1. Sign up at **tidbcloud.com** (no credit card needed) and create a **Starter** instance.
   Choose **MySQL-compatible**. Pick the region closest to you (Frankfurt, `eu-central-1`, if offered, because the backend is set to run in Frankfurt).
2. Open the instance and click **Connect**. Create/generate a password and note these four values:
   **host**, **port** (4000), **user** (looks like `abc123.root`), **password**.
3. If there is a network or IP access setting, allow access from anywhere (Vercel has no fixed IP address).
4. On your computer, in the `backend` folder:

```bash
cd backend
npm install
cp .env.example .env        # on Windows PowerShell: copy .env.example .env
```

5. Open `backend/.env` and fill in:

```
DB_HOST=<host from TiDB>
DB_PORT=4000
DB_USER=<user from TiDB>
DB_PASSWORD=<password from TiDB>
DB_NAME=batloung_farm
DB_SSL=true
JWT_SECRET=anything-long-here
```

6. Create the tables and sample data (run once):

```bash
npm run db:setup
```

You should see `Tables created.` and `Database seeded successfully!`.
It is safe to run again: if the tables already exist it changes nothing, so your data is never overwritten.

---

## Step 3. Deploy the backend on Vercel

1. Go to **vercel.com** > **Add New** > **Project** and import your GitHub repository.
2. Set **Root Directory** to `backend` (click Edit next to it). Framework Preset: **Other**.
3. Open **Environment Variables** and add:

| Name | Value |
|---|---|
| `DB_HOST` | host from TiDB |
| `DB_PORT` | `4000` |
| `DB_USER` | user from TiDB |
| `DB_PASSWORD` | password from TiDB |
| `DB_NAME` | `batloung_farm` |
| `DB_SSL` | `true` |
| `JWT_SECRET` | a long random value (generate one below) |
| `JWT_EXPIRES_IN` | `24h` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://placeholder.vercel.app` (you will fix this in Step 5) |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

4. Click **Deploy**.
5. Test it. Open these in your browser (replace with your backend address):

- `https://<backend>.vercel.app/api/health` should show `"status":"OK"`
- `https://<backend>.vercel.app/api/health/db` should show `"database":"connected"` and `"users":2`

If the second one fails, do not continue. See Troubleshooting below.

---

## Step 4. Deploy the frontend on Vercel

1. **Add New** > **Project**, import the **same** repository again.
2. Set **Root Directory** to `frontend`. Framework Preset: **Vite** (detected automatically).
3. Add one environment variable:

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://<backend>.vercel.app/api` |

4. Click **Deploy** and copy the frontend address, for example `https://batloung-farm.vercel.app`.

---

## Step 5. Connect the two (do not skip)

1. Open the **backend** project on Vercel > **Settings** > **Environment Variables**.
2. Edit `FRONTEND_URL` and set it to your real frontend address (for example `https://batloung-farm.vercel.app`).
   To allow more than one address, separate them with commas.
3. Go to **Deployments** > open the latest one > **...** > **Redeploy**.
   Changed variables only apply after a redeploy.

Now open the frontend address and sign in:

- Administrator: `admin` / `admin123`
- Sales: `sales1` / `sales123`

---

## Checklist before you present it

- [ ] `/api/health/db` shows `connected`
- [ ] Dashboard loads with numbers and charts
- [ ] Sign in works for both users; Sales user cannot open Reports
- [ ] Refreshing a page like `/inventory` still works (no 404)
- [ ] Add a fruit or a sale, refresh, and it is still there

## Troubleshooting

| What you see | Cause and fix |
|---|---|
| Browser console: *blocked by CORS policy* | `FRONTEND_URL` on the backend does not match the frontend address exactly, or you did not redeploy after changing it (Step 5). |
| Login says *Network Error* | `VITE_API_URL` is missing or wrong. Fix it in the frontend project, then **Redeploy** (it is read at build time). |
| `/api/health/db` shows `ENOTFOUND` or `ETIMEDOUT` | `DB_HOST` or `DB_PORT` is wrong, or the TiDB instance blocks outside access (allow all IPs). |
| `ER_ACCESS_DENIED_ERROR` | `DB_USER` or `DB_PASSWORD` is wrong. Use the full user including the prefix, such as `abc123.root`. |
| `ER_NO_SUCH_TABLE` | You have not run `npm run db:setup` yet, or it ran against a different `DB_NAME`. |
| *Secure connection required* / SSL error | Set `DB_SSL=true` on Vercel and in `backend/.env`. |
| Login returns 500 | `JWT_SECRET` is not set on the backend project. |
| Slow first request after a quiet period | Normal for free serverless hosting and a database that sleeps when idle. The next requests are fast. |
| Backend and database in far-apart regions are slow | Change `"regions"` in `backend/vercel.json` to the Vercel region nearest your database, commit, and push. |

Every `git push` to `main` redeploys both projects automatically.

## After deploying

- The sample passwords are public in the README. Change them before sharing the link widely, or remove the "Demo access" box from `frontend/src/pages/Login.jsx`.
- To reset the online database to the sample data: `FORCE_RESET=true npm run db:setup` (this deletes all current data).
