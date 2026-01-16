# Connect - Quick Deployment Checklist

Use this checklist to ensure you don't miss any steps during deployment.

## Pre-Deployment

- [ ] Admin account created and tested (`admin0909@gmail.com`)
- [ ] All test accounts cleaned up (Admin Panel → Cleanup button)
- [ ] Code committed to Git
- [ ] `.gitignore` files in place (backend and root)
- [ ] All features tested locally

## MongoDB Atlas Setup

- [ ] Account created at mongodb.com
- [ ] Free M0 cluster created
- [ ] Database user created with strong password
- [ ] Network access set to 0.0.0.0/0 (Allow from anywhere)
- [ ] Connection string copied and saved securely
- [ ] Database name added to connection string: `connect-messaging`

## GitHub Setup

- [ ] Repository created on GitHub
- [ ] Code pushed to main branch
- [ ] Repository is accessible (public or private with proper access)

## Backend Deployment (Render)

- [ ] Render account created
- [ ] New Web Service created
- [ ] GitHub repository connected
- [ ] Root directory set to: `backend`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] Environment variables added:
  - [ ] `MONGODB_URI` = (your MongoDB connection string)
  - [ ] `PORT` = `3001`
  - [ ] `NODE_ENV` = `production`
- [ ] Service deployed successfully
- [ ] Health check passes: `/health` endpoint returns OK
- [ ] Backend URL saved: `https://____________.onrender.com`

## Frontend Deployment (Vercel)

- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Framework preset: `Vite`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variable added:
  - [ ] `VITE_BACKEND_URL` = (your Render backend URL)
- [ ] Project deployed successfully
- [ ] Frontend URL saved: `https://____________.vercel.app`

## Post-Deployment Testing

- [ ] Frontend loads without errors
- [ ] Backend health check works
- [ ] Can register new user
- [ ] Can login as admin
- [ ] Can send messages between users
- [ ] Can create groups
- [ ] Can send images, files, audio
- [ ] Can edit/delete messages
- [ ] Admin can ban users
- [ ] Banned users see read-only mode
- [ ] Group info modal works
- [ ] Admin can add/remove group members

## Optional Enhancements

- [ ] Custom domain configured (frontend)
- [ ] Custom domain configured (backend)
- [ ] SSL certificates verified (automatic)
- [ ] Monitoring/alerts set up
- [ ] Analytics added (Google Analytics, etc.)
- [ ] Error tracking added (Sentry, etc.)

## Documentation

- [ ] Deployment URLs documented
- [ ] Admin credentials saved securely
- [ ] MongoDB credentials saved securely
- [ ] Backup strategy planned

## Final Steps

- [ ] Share app with test users
- [ ] Monitor logs for first 24 hours
- [ ] Gather initial feedback
- [ ] Fix any issues that arise
- [ ] Celebrate! 🎉

---

## Quick Reference

### Important URLs

- **Frontend**: `https://____________.vercel.app`
- **Backend**: `https://____________.onrender.com`
- **Backend Health**: `https://____________.onrender.com/health`
- **MongoDB Dashboard**: https://cloud.mongodb.com
- **Render Dashboard**: https://dashboard.render.com
- **Vercel Dashboard**: https://vercel.com/dashboard

### Admin Credentials

- **Username**: `admin0909`
- **Email**: `admin0909@gmail.com`

### Common Commands

```bash
# Push code changes
git add .
git commit -m "Your message"
git push origin main

# Check backend logs (Render)
# Go to dashboard → Your service → Logs tab

# Redeploy frontend (Vercel)
# Go to dashboard → Your project → Deployments → Redeploy

# Test backend health
curl https://your-backend-url.onrender.com/health
```

---

## Troubleshooting Quick Fixes

### Backend won't start
1. Check Render logs
2. Verify MongoDB connection string
3. Ensure all environment variables are set

### Frontend can't connect to backend
1. Check VITE_BACKEND_URL is correct
2. Test backend /health endpoint
3. Check browser console for CORS errors

### Database connection fails
1. Verify MongoDB user credentials
2. Check network access (0.0.0.0/0)
3. Test connection string format

### Slow response times
- Free tier sleeps after 15 min inactivity
- First request after sleep takes 30-60 seconds
- Consider upgrading to paid tier for 24/7 uptime

---

**Need detailed help?** See DEPLOY.md for full instructions.
