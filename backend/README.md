# Connect Messaging - Backend API

MongoDB-powered backend API for the Connect real-time messaging application.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update `MONGODB_URI` with your MongoDB connection string

## MongoDB Setup

### Option 1: Local MongoDB
```bash
# Install MongoDB locally and start the service
# Connection string: mongodb://localhost:27017/connect-messaging
```

### Option 2: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `.env` with: `mongodb+srv://username:password@cluster.mongodb.net/connect-messaging`

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Users
- `POST /users` - Register or retrieve user
- `GET /users` - Get all users
- `PUT /users/:id` - Update user profile

### Messages
- `POST /messages` - Send a message
- `GET /messages?u1=userId1&u2=userId2` - Get messages between two users
- `PUT /messages/:id` - Update message status

### Groups
- `POST /groups` - Create a new group
- `GET /groups?userId=id` - Get groups for a user
- `DELETE /groups/:id` - Delete a group (Admin only)

### Health Check
- `GET /health` - Server health status

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (required)
- `PORT` - Server port (default: 3000)

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.ts           # Database connection
│   ├── models/
│   │   ├── User.ts         # User model
│   │   ├── Message.ts      # Message model
│   │   └── Group.ts        # Group model
│   ├── controllers/
│   │   ├── userController.ts
│   │   ├── messageController.ts
│   │   └── groupController.ts
│   ├── routes/
│   │   └── index.ts        # API routes
│   └── server.ts           # Server entry point
├── .env                    # Environment variables
├── .env.example            # Environment template
├── package.json
└── tsconfig.json
```

## Troubleshooting

### Connection Issues
- Ensure MongoDB is running (local) or accessible (Atlas)
- Check your connection string format
- Verify network access in MongoDB Atlas

### Port Already in Use
- Change the `PORT` in `.env` file
- Or stop the process using port 3000

## License

ISC
