# Connect - Deployment Guide

This guide will walk you through deploying your Connect chat application to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
3. [Backend Deployment (Render)](#backend-deployment-render)
4. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Testing Your Deployment](#testing-your-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites 

Before you begin, make sure you have:
- ✅ A GitHub account (for code hosting)
- ✅ A MongoDB Atlas account (free tier available)
- ✅ A Render account (free tier available)
- ✅ A Vercel account (free tier available)
- ✅ Git installed on your computer
- ✅ Your admin account created (`admin0909@gmail.com`)
- ✅ Test data cleaned up (use Admin Panel → Cleanup button)

---

## Step 1: Database Setup (MongoDB Atlas)

### 1.1 Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account
3. Verify your email address

### 1.2 Create a New Cluster
1. Click **"Build a Database"**
2. Choose **"M0 FREE"** tier
3. Select a cloud provider (AWS recommended)
4. Choose a region closest to your users
5. Name your cluster (e.g., `connect-cluster`)
6. Click **"Create"**
7. Wait 3-5 minutes for cluster creation

### 1.3 Create Database User
1. Click **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `connect-admin` (or your choice)
5. Password: Generate a strong password (save it securely!)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### 1.4 Configure Network Access
1. Click **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ This is needed for Render to connect
4. Click **"Confirm"**

### 1.5 Get Connection String
1. Click **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://connect-admin:<password>@connect-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual database password
7. Add database name before the `?`:
   ```
   mongodb+srv://connect-admin:YOUR_PASSWORD@connect-cluster.xxxxx.mongodb.net/connect-messaging?retryWrites=true&w=majority
   ```
8. **Save this connection string securely!**

---

## Step 2: Backend Deployment (Render)

### 2.1 Prepare Backend for Deployment

1. **Create a `.gitignore` in backend folder** (if not exists):
   ```
   node_modules/
   dist/
   .env
   .env.local
   ```

2. **Update `backend/package.json`** - Add start script:
   ```json
   {
     "scripts": {
       "start": "node dist/server.js",
       "build": "tsc",
       "dev": "nodemon --exec ts-node src/server.ts"
     }
   }
   ```

3. **Verify `backend/tsconfig.json`** has:
   ```json
   {
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./src"
     }
   }
   ```

### 2.2 Push Code to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Connect chat app"
   ```

2. **Create GitHub Repository**:
   - Go to [https://github.com/new](https://github.com/new)
   - Repository name: `connect-chat-app`
   - Make it **Public** or **Private** (your choice)
   - Don't initialize with README (you already have code)
   - Click **"Create repository"**

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/connect-chat-app.git
   git branch -M main
   git push -u origin main
   ```

### 2.3 Deploy Backend on Render

1. **Create Render Account**:
   - Go to [https://render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**:
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Select `connect-chat-app` repository

3. **Configure Web Service**:
   - **Name**: `connect-backend` (or your choice)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. **Add Environment Variables**:
   Click **"Advanced"** → **"Add Environment Variable"**
   
   Add these variables:
   - **Key**: `MONGODB_URI`
     **Value**: Your MongoDB connection string from Step 1.5
   
   - **Key**: `PORT`
     **Value**: `3001`
   
   - **Key**: `NODE_ENV`
     **Value**: `production`

5. **Deploy**:
   - Click **"Create Web Service"**
   - Wait 5-10 minutes for deployment
   - You'll see build logs in real-time

6. **Get Backend URL**:
   - Once deployed, you'll see: `https://connect-backend-xxxx.onrender.com`
   - **Save this URL!** You'll need it for frontend

7. **Test Backend**:
   - Visit: `https://connect-backend-xxxx.onrender.com/health`
   - You should see: `{"status":"ok","message":"Server is running"}`

---

## Step 3: Frontend Deployment (Vercel)

### 3.1 Prepare Frontend for Deployment

1. **Create `vercel.json` in root directory**:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

2. **Update `vite.config.ts`** (if needed):
   ```typescript
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     build: {
       outDir: 'dist',
       sourcemap: false
     }
   });
   ```

3. **Create `.env.production` in root**:
   ```
   VITE_BACKEND_URL=https://connect-backend-xxxx.onrender.com
   ```
   Replace with your actual Render backend URL

4. **Update `services/api.ts`** to use environment variable:
   ```typescript
   const ENV_URL = import.meta.env.VITE_BACKEND_URL;
   let BASE_URL = localStorage.getItem('connect_api_url') || ENV_URL || 'http://localhost:3001';
   ```

5. **Commit changes**:
   ```bash
   git add .
   git commit -m "Configure for production deployment"
   git push origin main
   ```

### 3.2 Deploy Frontend on Vercel

1. **Create Vercel Account**:
   - Go to [https://vercel.com/signup](https://vercel.com/signup)
   - Sign up with GitHub

2. **Import Project**:
   - Click **"Add New..."** → **"Project"**
   - Import your `connect-chat-app` repository
   - Click **"Import"**

3. **Configure Project**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**:
   - Click **"Environment Variables"**
   - Add:
     - **Key**: `VITE_BACKEND_URL`
     - **Value**: `https://connect-backend-xxxx.onrender.com`
     - **Environment**: All (Production, Preview, Development)

5. **Deploy**:
   - Click **"Deploy"**
   - Wait 2-3 minutes for build and deployment
   - You'll see build logs

6. **Get Frontend URL**:
   - Once deployed: `https://connect-chat-app-xxxx.vercel.app`
   - This is your production URL!

---

## Step 4: Post-Deployment Configuration

### 4.1 Update CORS (if needed)

If you get CORS errors, update `backend/src/server.ts`:

```typescript
app.use(cors({
  origin: [
    'https://connect-chat-app-xxxx.vercel.app',
    'http://localhost:3002'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Then commit and push:
```bash
git add .
git commit -m "Update CORS for production"
git push origin main
```

Render will auto-deploy the changes.

### 4.2 Configure Custom Domain (Optional)

**For Vercel (Frontend)**:
1. Go to your project → **Settings** → **Domains**
2. Add your custom domain (e.g., `connect.yourdomain.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

**For Render (Backend)**:
1. Go to your service → **Settings** → **Custom Domains**
2. Add custom domain (e.g., `api.yourdomain.com`)
3. Configure DNS as instructed
4. SSL is automatic

---

## Step 5: Testing Your Deployment

### 5.1 Test Backend
1. Visit: `https://connect-backend-xxxx.onrender.com/health`
2. Should return: `{"status":"ok","message":"Server is running"}`

### 5.2 Test Frontend
1. Visit: `https://connect-chat-app-xxxx.vercel.app`
2. You should see the Connect login screen

### 5.3 Test Full Flow
1. **Login as Admin**:
   - Username: `admin0909`
   - Email: `admin0909@gmail.com`
   - Should login successfully

2. **Create Test User**:
   - Open incognito window
   - Create a new user account
   - Should be able to register

3. **Test Chat**:
   - Send messages between users
   - Create a group
   - Test all features

4. **Test Admin Features**:
   - Login as admin
   - Go to Admin Panel
   - Try banning a user
   - Verify banned user can't send messages

---

## Step 6: Monitoring & Maintenance

### 6.1 Monitor Backend (Render)
- Dashboard: [https://dashboard.render.com](https://dashboard.render.com)
- View logs: Click your service → **Logs** tab
- Check metrics: **Metrics** tab

### 6.2 Monitor Frontend (Vercel)
- Dashboard: [https://vercel.com/dashboard](https://vercel.com/dashboard)
- View deployments: Click project → **Deployments**
- Check analytics: **Analytics** tab

### 6.3 Monitor Database (MongoDB Atlas)
- Dashboard: [https://cloud.mongodb.com](https://cloud.mongodb.com)
- View metrics: **Metrics** tab
- Check storage: **Collections** tab

### 6.4 Set Up Alerts (Optional)
- **Render**: Settings → Notifications
- **Vercel**: Project Settings → Notifications
- **MongoDB**: Alerts → Create Alert

---

## Troubleshooting

### Backend Issues

**Problem**: Backend won't start
- Check Render logs for errors
- Verify MongoDB connection string is correct
- Ensure all environment variables are set
- Check if MongoDB Atlas IP whitelist includes 0.0.0.0/0

**Problem**: Database connection fails
- Verify MongoDB user credentials
- Check network access settings in Atlas
- Ensure connection string has correct database name
- Test connection string locally first

**Problem**: 502 Bad Gateway
- Backend is starting (wait 1-2 minutes)
- Check Render logs for startup errors
- Verify build command completed successfully

### Frontend Issues

**Problem**: Can't connect to backend
- Check `VITE_BACKEND_URL` environment variable
- Verify backend is running (test /health endpoint)
- Check browser console for CORS errors
- Ensure backend CORS allows your frontend domain

**Problem**: Build fails on Vercel
- Check build logs for specific errors
- Verify all dependencies are in package.json
- Ensure TypeScript has no errors locally
- Check Node version compatibility

**Problem**: Environment variables not working
- Redeploy after adding environment variables
- Ensure variable names start with `VITE_`
- Check variable is set for correct environment

### General Issues

**Problem**: Slow performance
- **Free tier limitations**: Render free tier sleeps after 15 min inactivity
- **Solution**: Upgrade to paid tier or use a ping service
- **Database**: Check MongoDB Atlas metrics for slow queries

**Problem**: Users can't see each other
- Check if users are banned
- Verify database has user records
- Check backend logs for errors
- Test API endpoints directly

---

## Important Notes

### Free Tier Limitations

**Render Free Tier**:
- ⚠️ Sleeps after 15 minutes of inactivity
- ⚠️ Takes 30-60 seconds to wake up
- ⚠️ 750 hours/month (enough for one service)
- ✅ Automatic SSL
- ✅ Automatic deploys from GitHub

**Vercel Free Tier**:
- ✅ Unlimited bandwidth
- ✅ Automatic SSL
- ✅ Automatic deploys from GitHub
- ✅ 100 GB bandwidth/month

**MongoDB Atlas Free Tier**:
- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ Good for ~1000 users

### Security Best Practices

1. **Never commit `.env` files** to GitHub
2. **Use strong passwords** for MongoDB
3. **Rotate credentials** periodically
4. **Monitor logs** for suspicious activity
5. **Keep dependencies updated**: `npm audit fix`
6. **Enable 2FA** on all accounts (GitHub, Render, Vercel, MongoDB)

### Backup Strategy

1. **MongoDB Atlas Backups**:
   - Free tier: No automatic backups
   - Paid tier: Automatic continuous backups
   - Manual: Use `mongodump` to backup locally

2. **Code Backups**:
   - GitHub is your backup
   - Consider private repository for production

---

## Upgrade Paths

### When to Upgrade

**Render** ($7/month):
- Need 24/7 uptime (no sleep)
- More than 100 concurrent users
- Need faster response times

**MongoDB Atlas** ($9/month):
- Need more than 512 MB storage
- Need automatic backups
- Need better performance

**Vercel** (Free is usually enough):
- Only upgrade if you need advanced features
- Free tier is very generous

---

## Support & Resources

### Documentation
- **Render**: [https://render.com/docs](https://render.com/docs)
- **Vercel**: [https://vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas**: [https://docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

### Community
- **Render Community**: [https://community.render.com](https://community.render.com)
- **Vercel Discord**: [https://vercel.com/discord](https://vercel.com/discord)
- **MongoDB Forums**: [https://www.mongodb.com/community/forums](https://www.mongodb.com/community/forums)

---

## Deployment Checklist

Before going live, ensure:

- [ ] Admin account created (`admin0909@gmail.com`)
- [ ] Test data cleaned up (Admin Panel → Cleanup)
- [ ] MongoDB Atlas cluster created and configured
- [ ] Database user created with strong password
- [ ] Network access allows 0.0.0.0/0
- [ ] Backend deployed on Render
- [ ] Backend environment variables set (MONGODB_URI, PORT)
- [ ] Backend health check passes
- [ ] Frontend deployed on Vercel
- [ ] Frontend environment variable set (VITE_BACKEND_URL)
- [ ] CORS configured correctly
- [ ] Full user flow tested (register, login, chat, groups)
- [ ] Admin features tested (ban, delete, cleanup)
- [ ] Mobile responsiveness checked
- [ ] All features working in production

---

## Your Deployment URLs

Fill these in after deployment:

- **Frontend URL**: `https://_____________________.vercel.app`
- **Backend URL**: `https://_____________________.onrender.com`
- **MongoDB Cluster**: `connect-cluster._____.mongodb.net`

---

## Next Steps After Deployment

1. **Share your app** with friends and family
2. **Monitor usage** in the first few days
3. **Gather feedback** from users
4. **Fix any issues** that arise
5. **Consider upgrades** if you get popular
6. **Add custom domain** for professional look
7. **Set up analytics** (Google Analytics, etc.)
8. **Add more features** based on user feedback

---

## Congratulations! 🎉

Your Connect chat application is now live and ready for users!

Remember to:
- Monitor your services regularly
- Keep your code updated
- Respond to user feedback
- Have fun with your deployed app!

---

**Need Help?**
- Check the troubleshooting section above
- Review service logs for errors
- Test each component individually
- Reach out to service support if needed

Good luck with your deployment! 🚀
