# E-Cell SITRC Platform — 100% Free Production Deployment Guide

This guide walks you step-by-step through deploying your **E-Cell SITRC** platform online with **zero hosting cost ($0/month forever)** and **zero data loss**, keeping all your existing admin accounts, student registrations, startup ideas, events, announcements, and blogs.

---

## Architecture Overview & 100% Free Hosting Stack

| Component | Selected Host | Plan | Cost | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Hobby (Free) | **$0.00** | Free global CDN, automatic SSL certificates, native Vite/React SPA routing. |
| **Backend** | **Render** | Free Web Service | **$0.00** | Stateless Node.js + Express API container with auto-deploy on git push. |
| **Database** | **Neon** | Free Tier | **$0.00** | Serverless Cloud PostgreSQL (0.5 GB storage, auto-scaling, SSL required). |

---

## Pre-Deployment Preparation Checklist (Completed Locally ✅)

1. [x] **SQLite Preserved:** `backend/prisma/dev.db` is backed up safely (`dev.db.pre-neon-migration.backup`).
2. [x] **Full 17-Model Export:** Generated verified JSON snapshot via `npm run db:export` in `backend/prisma/db-export-latest.json`.
3. [x] **PostgreSQL Schema:** Configured `backend/prisma/schema.prisma` with `provider = "postgresql"` and `directUrl`.
4. [x] **Case-Insensitive Search:** Added `mode: 'insensitive'` to all `contains` search filters across events, ideas, blog, and registrations.
5. [x] **Migration Script:** Created `npm run db:migrate:neon` (`migrate-to-neon.ts`) with idempotent upserts, foreign-key ordering, and 100% data parity verification.
6. [x] **Render Free Blueprint:** Updated `render.yaml` to `plan: free` with zero disk fees.
7. [x] **SPA Routing:** Configured `frontend/vercel.json` and `frontend/public/_redirects`.

---

## Step 1: Create Your Free Neon PostgreSQL Database

1. Sign up or log in at **[Neon.tech](https://neon.tech)** (free, no credit card required).
2. Create a new project (e.g. `ecell-sitrc`).
3. Neon will present your **Connection Details**:
   - **Pooled connection string** (ends with `-pooler.neon.tech`): Use this as `DATABASE_URL`.
   - **Direct connection string** (ends with `.neon.tech`): Use this as `DIRECT_URL`.
   - Make sure `?sslmode=require` is present at the end of both strings.

---

## Step 2: Push Code to GitHub

Open PowerShell in `C:\Users\HP\Desktop\ecell`:

```powershell
# 1. Verify git status
git status

# 2. Stage reviewed changes
git add .

# 3. Commit
git commit -m "chore: configure PostgreSQL support for Neon free tier"

# 4. Push to main branch
git push origin main
```

---

## Step 3: Initialize Schema & Migrate Data to Neon

Once you have your Neon connection strings, perform the initial data transfer from your local machine:

1. In `backend/.env`, temporarily configure your Neon database URLs:
   ```env
   DATABASE_URL="postgresql://user:password@ep-your-project-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgresql://user:password@ep-your-project.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
2. In PowerShell inside `backend`:
   ```powershell
   # 1. Push schema tables and indexes to Neon
   npx prisma db push

   # 2. Run the automated data migration script
   npm run db:migrate:neon
   ```
3. The script will import all 17 models, preserve every user account and password hash, and display the **100% Data Parity Verification Table**.

---

## Step 4: Deploy Backend to Render (Free Tier)

1. Log in to **[Render.com](https://render.com)**.
2. Click **New +** -> **Web Service**.
3. Connect your **E-cell** GitHub repository (`main` branch).
4. Configure Web Service settings:
   - **Name:** `ecell-sitrc-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Region:** Choose the region closest to your Neon database (e.g., Ohio / Frankfurt / Singapore)
   - **Instance Type:** **Free** ($0/month)
   - **Build Command:** `npm install --include=dev && npx prisma generate && npm run build`
   - **Start Command:** `npm run start`
   - **Health Check Path:** `/api/health`
5. Configure **Environment Variables** in Render:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = *(Paste your Neon Pooled Connection String)*
   - `DIRECT_URL` = *(Paste your Neon Direct Connection String)*
   - `JWT_SECRET` = *(Click "Generate" or enter a secure 64-char random string)*
   - `JWT_EXPIRES_IN` = `7d`
   - `FRONTEND_URL` = *(We will paste your Vercel URL here in Step 6)*
   - `UPLOAD_DIR` = `uploads`
6. Click **Create Web Service**.
7. Once deployed, Render will provide your live backend URL:
   `https://ecell-sitrc-backend.onrender.com`

---

## Step 5: Deploy Frontend to Vercel (Free Tier)

1. Log in to **[Vercel.com](https://vercel.com)**.
2. Click **Add New...** -> **Project**.
3. Import your **E-cell** repository.
4. Configure Project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and select `frontend`.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add the **Environment Variable**:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://ecell-sitrc-backend.onrender.com/api` *(replace with your actual Render URL)*
6. Click **Deploy**.
7. Vercel will build and assign your live URL: `https://ecell-sitrc.vercel.app`.

---

## Step 6: Final Linkage (CORS)

1. Copy your live Vercel URL (e.g. `https://ecell-sitrc.vercel.app`).
2. Go back to **Render** -> `ecell-sitrc-backend` -> **Environment Variables**.
3. Update `FRONTEND_URL` to `https://ecell-sitrc.vercel.app`.
4. Render will automatically redeploy with CORS active for your Vercel domain.

---

## Verification & Testing Checklist

- [ ] Visit `https://your-site.vercel.app` (verify all pages, gallery, notice board, and events load).
- [ ] Visit `https://your-site.vercel.app/admin/login` and log in with any of your 9 authorized admin emails.
- [ ] Test student registration and login.
- [ ] Test Incubation Idea submission.
- [ ] Check footer contact telephone links and social media channels.
