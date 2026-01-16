import { MongoClient, Db } from 'mongodb';

class DatabaseConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private connectionUri: string;
  private dbName: string;
  private maxRetries: number = 5;
  private retryDelay: number = 10000; // 10 seconds

  constructor(uri: string, dbName: string = 'connect-messaging') {
    this.connectionUri = uri;
    this.dbName = dbName;
  }

  /**
   * Establish connection to MongoDB with retry logic
   */
  async connect(): Promise<Db> {
    let attempts = 0;

    while (attempts < this.maxRetries) {
      try {
        console.log(`[DB] Attempting to connect to MongoDB (attempt ${attempts + 1}/${this.maxRetries})...`);
        
        this.client = new MongoClient(this.connectionUri, {
          minPoolSize: 5,
          maxPoolSize: 20,
        });

        await this.client.connect();
        this.db = this.client.db(this.dbName);
        
        // Test the connection
        await this.db.command({ ping: 1 });
        
        console.log(`[DB] Successfully connected to MongoDB database: ${this.dbName}`);
        return this.db;
      } catch (error) {
        attempts++;
        console.error(`[DB] Connection attempt ${attempts} failed:`, error);
        
        if (attempts >= this.maxRetries) {
          throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts`);
        }
        
        console.log(`[DB] Retrying in ${this.retryDelay / 1000} seconds...`);
        await this.sleep(this.retryDelay);
      }
    }

    throw new Error('Failed to connect to MongoDB');
  }

  /**
   * Get the database instance
   */
  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  /**
   * Check if database is connected
   */
  isConnected(): boolean {
    return this.db !== null && this.client !== null;
  }

  /**
   * Gracefully close database connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      console.log('[DB] Closing MongoDB connection...');
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('[DB] MongoDB connection closed');
    }
  }

  /**
   * Helper function to sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let dbConnection: DatabaseConnection | null = null;

/**
 * Initialize database connection
 */
export const initializeDatabase = async (uri: string, dbName?: string): Promise<Db> => {
  if (!dbConnection) {
    dbConnection = new DatabaseConnection(uri, dbName);
  }
  return await dbConnection.connect();
};

/**
 * Get database instance
 */
export const getDatabase = (): Db => {
  if (!dbConnection) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbConnection.getDb();
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (dbConnection) {
    await dbConnection.disconnect();
    dbConnection = null;
  }
};

/**
 * Check if database is connected
 */
export const isDatabaseConnected = (): boolean => {
  return dbConnection ? dbConnection.isConnected() : false;
};
