# NETRA SHAKTI // Render Deployment Guide

### Tagline: `TRACE THE ORIGIN, PROVE THE TRUTH`
**DEFENCE-Grade Cryptographic Attribution & Immutable Decryption Provenance Platform**

This guide provides end-to-end instructions for deploying the **NETRA SHAKTI** Backend API and PostgreSQL Database on **Render** (https://render.com).

---

## Architecture Overview

```text
+-------------------------------------------------------+
|                 NEXT.JS FRONTEND                      |
|           (Deployed on Vercel / Cloud)                |
+-------------------------------------------------------+
                           |
          HTTPS / REST API | (CORS + HttpOnly Cookies)
                           v
+-------------------------------------------------------+
|               NETRA SHAKTI API SERVICE                |
|              (Render Web Service / Node)              |
|        - Swagger Documentation: /api/docs             |
|        - Health Check Endpoint: /api/v1/system/health |
+-------------------------------------------------------+
                           |
      DATABASE_URL         | (Prisma ORM Client)
                           v
+-------------------------------------------------------+
|             RENDER POSTGRESQL DATABASE                |
|           (Managed PostgreSQL Instance)               |
|   - Auto Schema Push via Prisma                       |
|   - Auto-Bootstrapped Super Admin                     |
+-------------------------------------------------------+
```

---

## Method 1: Automated Blueprint Deployment (Recommended)

Render Blueprints allow you to provision **both** the PostgreSQL Database and the Backend Web Service with a single click using the included [`render.yaml`](../render.yaml) file.

### Step 1: Push Code to GitHub
Ensure the latest code is committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "feat(deploy): configure Render blueprint and PostgreSQL sync"
git push origin <your-branch>
```

### Step 2: Create Blueprint on Render
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click the **New +** button in the top right.
3. Select **Blueprint**.
4. Connect your GitHub repository (`NETRA-SHAKTI`).
5. Render will detect [`render.yaml`](../render.yaml) automatically.
6. Click **Apply**.

Render will automatically:
- Provision the **`netra-shakti-db`** Managed PostgreSQL database.
- Provision the **`netra-shakti-api`** Web Service.
- Automatically link `DATABASE_URL` from the database to the API.
- Execute `npm run build:render` to generate the Prisma client and build all packages.
- Execute `npm run start:render` to sync database tables (`prisma db push`), bootstrap the initial Super Admin, and start the API on `0.0.0.0:10000`.

---

## Method 2: Manual Service Creation on Render

If you prefer to configure services manually in the Render dashboard:

### Step 1: Create PostgreSQL Database
1. Go to [Render Dashboard](https://dashboard.render.com) > **New +** > **PostgreSQL**.
2. Fill in the details:
   - **Name**: `netra-shakti-db`
   - **Database**: `netrashakti`
   - **User**: `netra_admin`
   - **Region**: Oregon (or your preferred region)
   - **Plan**: Free (or Starter/Standard)
3. Click **Create Database**.
4. Once created, copy the **Internal Database URL** (e.g. `postgres://netra_admin:...@dpg-...:5432/netrashakti`).

### Step 2: Create Web Service
1. In the Render Dashboard, click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `netra-shakti-api`
   - **Region**: Same region as your database (e.g., Oregon)
   - **Branch**: `main` (or your active branch)
   - **Root Directory**: Leave blank (default `.`)
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm run build:render
     ```
   - **Start Command**:
     ```bash
     npm run start:render
     ```
   - **Plan**: Free (or Starter)

4. Add the **Environment Variables**:
   | Variable | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Production environment |
   | `PORT` | `10000` | Render standard port |
   | `DATABASE_URL` | *(Paste Internal Database URL from Step 1)* | PostgreSQL connection string |
   | `JWT_SECRET` | *(Click "Generate" or enter 32+ random characters)* | Token signing key |
   | `JWT_EXPIRES_IN` | `15m` | Access token lifespan |
   | `REFRESH_TOKEN_EXPIRES_IN` | `7d` | Refresh session lifespan |
   | `MASTER_ENCRYPTION_KEY` | *(Click "Generate" or enter 64 hex characters)* | AES-256 root key |
   | `CORS_ORIGIN` | `*` (or your frontend URL) | Allowed CORS origins |
   | `FRONTEND_URL` | `https://netra-shakti-jy7p.vercel.app` | Vercel production frontend |

5. Under **Health Check Path**, enter:
   ```text
   /api/v1/system/health
   ```
6. Click **Create Web Service**.

---

## Connecting the Frontend to the Render Backend

Once Render deploys your backend, it will assign you a live public URL (e.g., `https://netra-shakti-api.onrender.com`).

### Updating Vercel / Frontend Environment
In your Vercel project settings (or `.env.production`):
```env
NEXT_PUBLIC_API_URL=https://netra-shakti-api.onrender.com/api/v1
```

Redeploy the frontend to apply the new backend URL.

---

## Verifying Deployment

### 1. Health Check
Open in your browser or run:
```bash
curl https://<your-render-app-name>.onrender.com/api/v1/system/health
```
**Expected Response:**
```json
{
  "status": "UP",
  "services": {
    "database": { "status": "UP" },
    "crypto": { "status": "UP" },
    "ledger": { "status": "UP" }
  }
}
```

### 2. Swagger OpenAPI Documentation
Open in browser:
```text
https://<your-render-app-name>.onrender.com/api/docs
```

### 3. Super Admin Initial Credentials
The startup script automatically creates the first DEFENCE Super Admin account:
- **Username**: `netra.admin`
- **Email**: `admin@defence.netrashakti.gov`
- **Initial Password**: `Netra@Shakti2026!Defence`
*(Note: A password change is required upon first login for defense compliance).*

---

## Troubleshooting

- **Cold Starts on Free Tier**: Render free instances spin down after 15 minutes of inactivity and take ~30-50 seconds to wake up. This is standard behavior for Render's free tier.
- **Prisma Connection Timeouts**: Ensure both the Web Service and PostgreSQL database are created in the **same Render region** (e.g. Oregon). Use the **Internal Database URL** for zero latency.
- **CORS Issues**: Set `CORS_ORIGIN=*` or specify your exact frontend domain including protocol (e.g., `https://netra-shakti-jy7p.vercel.app`).
