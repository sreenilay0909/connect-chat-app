# Run and deploy your AI Studio app

This contains everything you need to run your app locally with MongoDB integration.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)

## Setup

### 1. Install Frontend Dependencies
```bash
npm install
```

### 2. Set up Gemini API Key
Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

### 3. Set up MongoDB Backend

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Navigate to backend directory:
   ```bash
   cd backend
   npm install
   ```
4. The `.env` file is already configured for local MongoDB

#### Option B: MongoDB Atlas (Cloud - Recommended)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Navigate to backend directory:
   ```bash
   cd backend
   npm install
   ```
5. Update `backend/.env` with your Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/connect-messaging
   ```

## Run Locally

### Start Backend Server (Terminal 1)
```bash
cd backend
npm run dev
```
The backend will start on `http://localhost:3001`

### Start Frontend (Terminal 2)
```bash
npm run dev
```
The frontend will start on `http://localhost:5173`

## Features

- Real-time messaging with MongoDB persistence
- User profiles with avatars
- AI chatbot integration (Gemini)
- Automatic fallback to localStorage if backend is unavailable
- Message history across devices
- Group chat functionality


## Offline Mode

If the backend is not running, the app automatically falls back to localStorage for offline functionality. Data will sync to MongoDB when the backend becomes available.

## API Endpoints

The backend exposes the following endpoints:
- `POST /users` - Register or retrieve user
- `GET /users` - Get all users
- `POST /messages` - Send a message
- `GET /messages?u1=userId1&u2=userId2` - Get messages between users

See `backend/README.md` for detailed API documentation.











connect-admin    username
eou8RaUNJNqGRn5I   password 


mongodb+srv://<connect-admin>:<eou8RaUNJNqGRn5I>@cluster0.rjmijfs.mongodb.net/?appName=Cluster0