# E-Cell SITRC Platform — Beginner-Friendly Deployment Guide

This guide walks you step-by-step through deploying your **E-Cell SITRC** platform online with **zero data loss**, keeping all your existing admin accounts, student registrations, startup ideas, and events.

---

## Architecture Overview & Selected Hosting Providers

| Component | Selected Host | Why This Host? | Cost |
| :--- | :--- | :--- | :--- |
| **Frontend** (Vite + React) | **Vercel** | Free global CDN, automatic SSL certificates, native support for Vite & React Router SPAs, zero config. | Free |
| **Backend** (Node.js + Express) | **Render** (or **Railway**) | Native Node.js support, automatic health checks, and supports **Persistent Disk Volumes** to keep your SQLite database safe across restarts. | Free / Low-cost |
| **Database** (Prisma + SQLite) | **Mounted Persistent Disk** | Keeps your existing `dev.db` file 100% intact without requiring database schema rewrites or migration. | Included with host volume |

---

## Pre-Deployment Checklist (Already Completed Locally ✅)

1. [x] **Frontend Dynamic API URL:** Updated `frontend/src/App.tsx` to read `import.meta.env.VITE_API_BASE_URL`.
2. [x] **SPA Routing Fix:** Created `frontend/vercel.json` and `frontend/public/_redirects` to prevent 404s on browser reload.
3. [x] **CORS Configuration:** Enhanced `backend/src/index.ts` to support production origins and Vercel domains.
4. [x] **Database Safety:** Added `npm run db:export` which created a full JSON backup of all tables in `backend/prisma/db-export-latest.json`.
5. [x] **Git Security:** Updated `.gitignore` across root, backend, and frontend to protect all `.env` files and `.backup` database files from being committed to GitHub.
6. [x] **Production Builds:** Both `frontend` and `backend` build successfully with 0 errors.

---

## Step 1: Push Code to GitHub

Open PowerShell in `C:\Users\HP\Desktop\ecell`:

```powershell
# 1. Review status to confirm no passwords, backups, or .env files are staged
git status

# 2. Add all verified project files
git add .

# 3. Commit the deployment preparation
git commit -m "chore: prepare frontend and backend for production deployment"

# 4. Push to your GitHub repository
git push origin main
```

---

## Step 2: Deploy Backend to Render

1. Log in to **[Render.com](https://render.com)** (sign in with your GitHub account).
2. Click **New +** and select **Web Service**.
3. Connect your **E-cell** GitHub repository.
4. Configure the Web Service settings:
   - **Name:** `ecell-sitrc-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build && npx prisma generate`
   - **Start Command:** `npm run start`
   - **Health Check Path:** `/api/health`
5. **Attach a Persistent Disk (CRITICAL for SQLite data preservation):**
   - Scroll down to **Disks** and click **Add Disk**.
   - **Name:** `ecell-data`
   - **Mount Path:** `/data`
   - **Size:** `1 GB` (plenty for SQLite & uploads)
6. Configure **Environment Variables** in Render:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `file:/data/dev.db`
   - `JWT_SECRET` = *(Click "Generate" or type a strong random string)*
   - `JWT_EXPIRES_IN` = `7d`
   - `UPLOAD_DIR` = `/data/uploads`
   - `FRONTEND_URL` = *(We will paste your Vercel URL here in Step 4)*
7. Click **Create Web Service**.

---

## Step 3: Production SQLite Database & Data Preservation

When your backend first deploys with a persistent disk, `/data` is an empty volume. Running `npx prisma db push` will create the SQLite tables, but it **does not** automatically transfer your existing records.

Choose one of the two options below depending on your goal:

### Option A: Transfer & Preserve All Existing Local Records (Recommended)
This preserves all your existing 9 admin accounts, student accounts, events, announcements, and startup idea submissions.

1. **Encode your local database:**
   In local PowerShell on your machine:
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("backend\prisma\dev.db")) | Set-Content dev.db.b64
   ```
2. **Transfer to Render:**
   - In Render, navigate to your `ecell-sitrc-backend` dashboard and click the **Shell** tab (opens a live SSH terminal).
   - Ensure the `/data` directory exists:
     ```bash
     mkdir -p /data
     ```
   - Decode your database onto the persistent disk:
     ```bash
     cat << 'EOF' | base64 -d > /data/dev.db
     <PASTE_CONTENTS_OF_dev.db.b64_HERE>
     EOF
     ```
   - Verify the database file is present:
     ```bash
     ls -lh /data/dev.db
     ```
   - Ensure Prisma schema is in sync (non-destructive):
     ```bash
     npx prisma db push
     ```

### Option B: Fresh Production Database with Safe Admin Provisioning
If you prefer starting with a fresh production database:

1. In Render **Shell**:
   ```bash
   mkdir -p /data
   npx prisma db push
   ```
2. Provision the 9 authorized administrators:
   ```bash
   npm run admin:setup
   ```
   > **Note on Password Safety:** `npm run admin:setup` runs in default safe mode. If an administrator account already exists, its password is **strictly preserved** and will not be overwritten. To intentionally reset existing administrator passwords, pass `--reset-passwords`.

3. Your live backend service URL will be displayed in your Render dashboard (e.g., `https://ecell-sitrc-backend.onrender.com`). Verify it by visiting `https://ecell-sitrc-backend.onrender.com/api/health`.

---

## Step 4: Deploy Frontend to Vercel

1. Log in to **[Vercel.com](https://vercel.com)** (sign in with GitHub).
2. Click **Add New...** -> **Project**.
3. Import your **E-cell** repository.
4. Configure Project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and choose `frontend`.
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
5. Add the **Environment Variable**:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://ecell-sitrc-backend.onrender.com/api` *(replace with your actual Render backend URL)*
6. Click **Deploy**.
7. Vercel will build and assign you a production URL, e.g. `https://ecell-sitrc.vercel.app`.

---

## Step 5: Final Linkage

1. Copy your new Vercel URL (e.g. `https://ecell-sitrc.vercel.app`).
2. Go back to **Render** -> `ecell-sitrc-backend` -> **Environment Variables**.
3. Set `FRONTEND_URL` = `https://ecell-sitrc.vercel.app`.
4. Render will automatically redeploy with CORS linked to your Vercel frontend.

---

## How to Test Your Live Website

1. Open your live Vercel URL in your browser.
2. Verify all sections: Overview, Events, Gallery, Notice Board, Team, and Leadership.
3. Test **Admin Login**:
   - Go to `https://your-site.vercel.app/admin/login`.
   - Log in with any of your 9 authorized admin emails.
4. Test **Incubation Idea Submission**:
   - Log in as a student and submit an idea.
   - Verify it appears in your submissions tracker.
5. Check footer telephone and social media links.
