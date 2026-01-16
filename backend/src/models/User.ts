import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../config/db';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  status: string;
  lastSeen: number;
  isAdmin?: boolean;
  isBanned?: boolean;
}

interface UserDocument {
  _id: ObjectId;
  username: string;
  email: string;
  avatar: string;
  status: string;
  lastSeen: number;
  isAdmin?: boolean;
  isBanned?: boolean;
}

export class UserModel {
  private collection: Collection<UserDocument>;

  constructor() {
    const db = getDatabase();
    this.collection = db.collection<UserDocument>('users');
  }

  /**
   * Transform MongoDB document to User object (convert _id to id)
   */
  private transformDocument(doc: UserDocument): User {
    return {
      id: doc._id.toString(),
      username: doc.username,
      email: doc.email,
      avatar: doc.avatar,
      status: doc.status,
      lastSeen: doc.lastSeen,
      isAdmin: doc.isAdmin || doc.email === 'admin0909@gmail.com',
      isBanned: doc.isBanned,
    };
  }

  /**
   * Create a new user
   */
  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const userDoc: Omit<UserDocument, '_id'> = {
      username: userData.username,
      email: userData.email,
      avatar: userData.avatar,
      status: userData.status,
      lastSeen: userData.lastSeen,
      isAdmin: userData.email === 'admin0909@gmail.com',
    };

    const result = await this.collection.insertOne(userDoc as UserDocument);

    return {
      id: result.insertedId.toString(),
      ...userData,
    };
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    const doc = await this.collection.findOne({ email });
    return doc ? this.transformDocument(doc) : null;
  }

  /**
   * Find user by ID
   */
  async findUserById(userId: string): Promise<User | null> {
    try {
      const doc = await this.collection.findOne({ _id: new ObjectId(userId) });
      return doc ? this.transformDocument(doc) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    const docs = await this.collection.find({ isBanned: { $ne: true } }).toArray();
    return docs.map(doc => this.transformDocument(doc));
  }

  /**
   * Get all users for admin (includes banned users)
   */
  async getAllUsersForAdmin(): Promise<User[]> {
    const docs = await this.collection.find({}).toArray();
    return docs.map(doc => this.transformDocument(doc));
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'email'>>): Promise<User | null> {
    const objectId = new ObjectId(userId);

    const result = await this.collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updates },
      { returnDocument: 'after' }
    );

    return result ? this.transformDocument(result) : null;
  }

  /**
   * Delete user (actually bans them)
   */
  async deleteUser(userId: string): Promise<boolean> {
    const objectId = new ObjectId(userId);
    const result = await this.collection.updateOne(
      { _id: objectId },
      { $set: { isBanned: true } }
    );
    return result.modifiedCount === 1;
  }

  /**
   * Ban user permanently (admin action)
   */
  async banUser(userId: string): Promise<boolean> {
    const objectId = new ObjectId(userId);
    const result = await this.collection.updateOne(
      { _id: objectId },
      { $set: { isBanned: true } }
    );
    return result.modifiedCount === 1;
  }

  /**
   * Permanently delete user and all their data
   */
  async permanentlyDeleteUser(userId: string): Promise<boolean> {
    const objectId = new ObjectId(userId);
    const result = await this.collection.deleteOne({ _id: objectId });
    return result.deletedCount === 1;
  }

  /**
   * Delete all users except admin (cleanup for deployment)
   */
  async deleteAllUsersExceptAdmin(): Promise<number> {
    const result = await this.collection.deleteMany({
      email: { $ne: 'admin0909@gmail.com' }
    });
    return result.deletedCount;
  }

  /**
   * Update lastSeen timestamp
   */
  async updateLastSeen(userId: string): Promise<void> {
    const objectId = new ObjectId(userId);
    await this.collection.updateOne(
      { _id: objectId },
      { $set: { lastSeen: Date.now() } }
    );
  }

  /**
   * Initialize collection with validation schema and indexes
   */
  async initializeCollection(): Promise<void> {
    const db = getDatabase();

    // Create collection with validation if it doesn't exist
    const collections = await db.listCollections({ name: 'users' }).toArray();

    if (collections.length === 0) {
      await db.createCollection('users', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['username', 'email', 'avatar', 'status', 'lastSeen'],
            properties: {
              username: {
                bsonType: 'string',
                minLength: 3,
                maxLength: 50,
                description: 'Username must be a string between 3 and 50 characters'
              },
              email: {
                bsonType: 'string',
                pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                description: 'Email must be a valid email address'
              },
              avatar: {
                bsonType: 'string',
                pattern: '^https?://',
                description: 'Avatar must be a valid URL'
              },
              status: {
                bsonType: 'string',
                maxLength: 200,
                description: 'Status must be a string with max 200 characters'
              },
              lastSeen: {
                bsonType: 'number',
                minimum: 0,
                description: 'LastSeen must be a positive number (Unix timestamp)'
              }
            }
          }
        }
      });
    }

    // Create unique index on email
    await this.collection.createIndex({ email: 1 }, { unique: true });

    // Create index on lastSeen for sorting
    await this.collection.createIndex({ lastSeen: -1 });

    console.log('[DB] User collection initialized with validation and indexes');
  }

  /**
   * Check if user is banned
   */
  async isUserBanned(userId: string): Promise<boolean> {
    try {
      const objectId = new ObjectId(userId);
      const user = await this.collection.findOne({ _id: objectId });
      return !!user?.isBanned;
    } catch (e) {
      return false;
    }
  }
}
