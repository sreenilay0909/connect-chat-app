# Quick Start Guide - MongoDB Integration

This guide will help you get the Connect messaging app running with MongoDB in minutes.

## Step 1: Install MongoDB

### Option A: MongoDB Atlas (Cloud - Easiest)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (free tier is fine)
4. Click "Connect" → "Connect your application"
5. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
6. Replace `<password>` with your actual password
7. Add `/connect-messaging` at the end

### Option B: Local MongoDB
1. Download and install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/connect-messaging`

## Step 2: Configure Backend

1. Open `backend/.env` file
2. Update the `MONGODB_URI` with your connection string:
   ```
   # For Atlas:
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/connect-messaging
   
   # For Local:
   MONGODB_URI=mongodb://localhost:27017/connect-messaging
   ```

## Step 3: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

## Step 4: Start the Application

Open **two terminal windows**:

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

You should see:
```
[Server] Starting server...
[DB] Successfully connected to MongoDB database: connect-messaging
[Server] Server is running on port 3001
```

### Terminal 2 - Frontend
```bash
npm run dev
```

You should see:
```
VITE v6.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Step 5: Test the App

1. Open your browser to `http://localhost:5173`
2. Create a user account
3. Send some messages
4. Check MongoDB to see your data!

### Verify Data in MongoDB

**For Atlas:**
1. Go to your cluster in MongoDB Atlas
2. Click "Browse Collections"
3. You should see `users` and `messages` collections

**For Local:**
```bash
mongosh
use connect-messaging
db.users.find()
db.messages.find()
```

## Troubleshooting

### Backend won't start
- Check that MongoDB is running (local) or accessible (Atlas)
- Verify your connection string in `backend/.env`
- Check for port conflicts (port 3001)

### Frontend shows "Using offline mode"
- Make sure backend is running on port 3001
- Check browser console for errors
- Verify `services/api.ts` has `BASE_URL = 'http://localhost:3001'`

### Connection timeout
- For Atlas: Check network access settings (allow your IP)
- For Local: Ensure MongoDB service is running

## What's Next?

- Deploy backend to Render/Railway/Heroku
- Deploy frontend to Vercel/Netlify
- Update `services/api.ts` with production backend URL
- Add more features!

## Need Help?

Check the detailed documentation:
- `README.md` - Main project documentation
- `backend/README.md` - Backend API documentation
- `.kiro/specs/mongodb-integration/` - Full specification
