import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, closeDatabase } from './config/db';
import { UserModel } from './models/User';
import { MessageModel } from './models/Message';
import { GroupModel } from './models/Group';
import routes, { initializeRoutes } from './routes';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Initialize server
async function startServer() {
  try {
    // Check if MongoDB URI is provided
    if (!MONGODB_URI) {
      console.error('[Server] ERROR: MONGODB_URI environment variable is not set');
      console.error('[Server] Please create a .env file with MONGODB_URI');
      process.exit(1);
    }

    console.log('[Server] Starting server...');

    // Initialize database connection
    await initializeDatabase(MONGODB_URI);

    // Initialize collections with validation and indexes
    const userModel = new UserModel();
    const messageModel = new MessageModel();
    const groupModel = new GroupModel();

    await userModel.initializeCollection();
    await messageModel.initializeCollection();
    await groupModel.initializeCollection();

    // Initialize routes (after database is connected)
    initializeRoutes();

    // Now create Express app AFTER database is ready
    const app = express();

    // Middleware: CORS
    app.use(cors({
      origin: '*', // Allow all origins for development
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Middleware: JSON body parser with increased limit for file uploads
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // Middleware: Request logging
    app.use((req: Request, res: Response, next: NextFunction) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.path}`);
      next();
    });

    // Health check endpoint
    app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', message: 'Server is running' });
    });

    // API routes
    app.use('/', routes);

    // 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found', details: `Route ${req.path} not found` });
    });

    // Error handler
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('[Server] Error:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    });

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`[Server] Server is running on port ${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/health`);
      console.log(`[Server] Ready to accept connections!`);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Received SIGINT, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Server] Received SIGTERM, shutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

// Start the server
startServer();
