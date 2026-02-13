# TaskFlow Deployment Guide

This guide explains how to deploy your TaskFlow application with the frontend on Hostinger and the backend on a free cloud platform.

## Overview

- **Frontend**: Static files deployed to Hostinger via FTP
- **Backend**: Node.js server deployed to Render (or similar platform)
- **Database**: MySQL database (can be on Render or separate service)

---

## Part 1: Deploy Backend to Render

### Step 1: Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### Step 2: Create a New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `abubakarsarwar-tech/taskflow`
3. Configure the service:
   - **Name**: `taskflow-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

### Step 3: Configure Environment Variables

In the Render dashboard, add these environment variables:

```bash
# Database Configuration
DB_HOST=your-database-host
DB_USER=your-database-username
DB_PASSWORD=your-database-password
DB_NAME=taskflow
DB_PORT=3306

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/api/auth/google/callback

# CORS Origins (your Hostinger domain)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Server Configuration
NODE_ENV=production
PORT=5000
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically deploy your backend
3. Wait for the build to complete (5-10 minutes)
4. Your backend URL will be: `https://your-app-name.onrender.com`

### Step 5: Test Backend

Visit your backend URL in a browser. You should see:
```json
{
  "message": "TaskFlow API Server",
  "version": "1.0.0",
  "status": "running"
}
```

Test the health endpoint: `https://your-app-name.onrender.com/api/health`

---

## Part 2: Configure Frontend for Production

### Step 1: Update Environment Variables

Edit `.env.production` in your project root:

```bash
# Replace with your actual Render backend URL
VITE_API_URL=https://your-app-name.onrender.com
VITE_SOCKET_URL=https://your-app-name.onrender.com

# Keep your Google Client ID
VITE_GOOGLE_CLIENT_ID=820802897696-5fcfh3dtseqd4p8geh6uaum82d9q4fni.apps.googleusercontent.com
```

### Step 2: Build Frontend

Run the build command:

```bash
npm run build
```

This creates a `dist/` folder with your production-ready static files.

### Step 3: Verify Build

Check that `dist/` contains:
- `index.html`
- `assets/` folder with CSS and JS files
- Other static assets

---

## Part 3: Deploy Frontend to Hostinger

### Step 1: Access Hostinger File Manager

1. Log in to your Hostinger account
2. Go to **Hosting** → **File Manager**
3. Navigate to `public_html` (or your domain's root directory)

### Step 2: Upload Files

1. Delete any existing files in `public_html` (except `.htaccess` if present)
2. Upload **all contents** from the `dist/` folder:
   - Upload `index.html`
   - Upload the `assets/` folder
   - Upload any other files/folders from `dist/`

**Important**: Upload the *contents* of `dist/`, not the `dist/` folder itself.

### Step 3: Configure .htaccess (for React Router)

Create or edit `.htaccess` in `public_html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

This ensures React Router works correctly with direct URL access.

---

## Part 4: Verification

### Test Your Deployment

1. **Visit your Hostinger domain** (e.g., `https://yourdomain.com`)
2. **Open Browser DevTools** → Network tab
3. **Test the following**:
   - ✅ Page loads correctly
   - ✅ Can register a new account
   - ✅ Can log in
   - ✅ Can create a board
   - ✅ Can add tasks
   - ✅ Real-time updates work (open in two browsers)

4. **Check API requests**:
   - All requests should go to `https://your-app-name.onrender.com/api/...`
   - No CORS errors in console
   - All requests return successful responses

### Common Issues

#### CORS Errors
- **Problem**: Browser shows CORS errors
- **Solution**: Make sure `CORS_ORIGINS` in Render includes your exact Hostinger domain (with https://)

#### API Requests Fail
- **Problem**: Network errors when making API calls
- **Solution**: Verify `.env.production` has the correct `VITE_API_URL`

#### Backend Slow on First Request
- **Problem**: First request takes 30-60 seconds
- **Solution**: This is normal for Render's free tier (server spins down after inactivity)

#### Real-time Updates Don't Work
- **Problem**: Socket.io connection fails
- **Solution**: Check `VITE_SOCKET_URL` matches your backend URL

---

## Part 5: Database Setup

### Option A: Use Render's PostgreSQL (Recommended)

1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Name it `taskflow-db`
3. Select **Free** tier
4. Copy the **Internal Database URL**
5. Update your backend environment variables with the connection details

### Option B: Use External MySQL

1. Use a service like [PlanetScale](https://planetscale.com) or [Railway](https://railway.app)
2. Create a MySQL database
3. Update backend environment variables with connection details

---

## Updating Your Application

### Update Backend

1. Push changes to GitHub
2. Render automatically redeploys (if auto-deploy is enabled)
3. Or manually trigger deploy in Render dashboard

### Update Frontend

1. Make your changes locally
2. Update `.env.production` if needed
3. Run `npm run build`
4. Upload new `dist/` contents to Hostinger via FTP

---

## Environment Variables Reference

### Backend (.env.production on Render)

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | Database host | `dpg-xxx.oregon-postgres.render.com` |
| `DB_USER` | Database username | `taskflow_user` |
| `DB_PASSWORD` | Database password | `your-secure-password` |
| `DB_NAME` | Database name | `taskflow` |
| `DB_PORT` | Database port | `3306` (MySQL) or `5432` (PostgreSQL) |
| `JWT_SECRET` | Secret for JWT tokens | Random 32+ character string |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `https://your-backend.onrender.com/api/auth/google/callback` |
| `CORS_ORIGINS` | Allowed frontend origins | `https://yourdomain.com,https://www.yourdomain.com` |
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `5000` |

### Frontend (.env.production local file)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-backend.onrender.com` |
| `VITE_SOCKET_URL` | Socket.io server URL | `https://your-backend.onrender.com` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Same as backend |

---

## Support

If you encounter issues:

1. Check Render logs: Dashboard → Your Service → Logs
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Test backend endpoints directly using Postman or curl

---

## Cost Summary

- **Render Free Tier**: 750 hours/month (enough for one app)
- **Hostinger**: Your existing hosting plan
- **Database**: Free tier available on Render/PlanetScale

**Total Monthly Cost**: $0 (using free tiers)
