import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../config/db';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  type: 'text' | 'image' | 'audio' | 'file';
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
  groupId?: string;
}

interface MessageDocument {
  _id: ObjectId;
  senderId: string;
  receiverId: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  type: 'text' | 'image' | 'audio' | 'file';
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
  groupId?: string;
}

export class MessageModel {
  private collection: Collection<MessageDocument>;

  constructor() {
    const db = getDatabase();
    this.collection = db.collection<MessageDocument>('messages');
  }

  /**
   * Transform MongoDB document to Message object (convert _id to id)
   */
  private transformDocument(doc: MessageDocument): Message {
    return {
      id: doc._id.toString(),
      senderId: doc.senderId,
      receiverId: doc.receiverId,
      text: doc.text,
      imageUrl: doc.imageUrl,
      audioUrl: doc.audioUrl,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      fileType: doc.fileType,
      type: doc.type,
      timestamp: doc.timestamp,
      status: doc.status,
      groupId: doc.groupId,
    };
  }

  /**
   * Create a new message
   */
  async createMessage(messageData: Omit<Message, 'id'>): Promise<Message> {
    const messageDoc: any = {
      senderId: messageData.senderId,
      receiverId: messageData.receiverId,
      type: messageData.type,
      timestamp: messageData.timestamp,
      status: messageData.status,
    };

    if (messageData.text) messageDoc.text = messageData.text;
    if (messageData.imageUrl) messageDoc.imageUrl = messageData.imageUrl;
    if (messageData.audioUrl) messageDoc.audioUrl = messageData.audioUrl;
    if (messageData.fileUrl) messageDoc.fileUrl = messageData.fileUrl;
    if (messageData.fileName) messageDoc.fileName = messageData.fileName;
    if (messageData.fileType) messageDoc.fileType = messageData.fileType;
    if (messageData.groupId) messageDoc.groupId = messageData.groupId;

    const result = await this.collection.insertOne(messageDoc as MessageDocument);

    return {
      id: result.insertedId.toString(),
      ...messageData,
    };
  }

  /**
   * Get messages between two users (bidirectional)
   */
  async getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]> {
    const docs = await this.collection
      .find({
        $or: [
          { senderId: user1Id, receiverId: user2Id },
          { senderId: user2Id, receiverId: user1Id }
        ]
      })
      .sort({ timestamp: 1 }) // Ascending order (oldest first)
      .limit(500) // Limit to most recent 500 messages
      .toArray();

    return docs.map(doc => this.transformDocument(doc));
  }

  /**
   * Get messages for a group
   */
  async getGroupMessages(groupId: string): Promise<Message[]> {
    const docs = await this.collection
      .find({ groupId })
      .sort({ timestamp: 1 })
      .limit(500)
      .toArray();

    return docs.map(doc => this.transformDocument(doc));
  }

  /**
   * Update message status
   */
  async updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read'): Promise<Message | null> {
    const objectId = new ObjectId(messageId);

    const result = await this.collection.findOneAndUpdate(
      { _id: objectId },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    return result ? this.transformDocument(result) : null;
  }

  /**
   * Update message text (for editing)
   */
  async updateMessageText(messageId: string, newText: string): Promise<Message | null> {
    const objectId = new ObjectId(messageId);

    const result = await this.collection.findOneAndUpdate(
      { _id: objectId },
      { $set: { text: newText } },
      { returnDocument: 'after' }
    );

    return result ? this.transformDocument(result) : null;
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    const objectId = new ObjectId(messageId);
    const result = await this.collection.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }

  /**
   * Delete all messages from a user (admin action)
   */
  async deleteAllMessagesFromUser(userId: string): Promise<number> {
    const result = await this.collection.deleteMany({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    });
    return result.deletedCount;
  }

  /**
   * Delete all messages in a group
   */
  async deleteAllMessagesInGroup(groupId: string): Promise<number> {
    const result = await this.collection.deleteMany({ groupId });
    return result.deletedCount;
  }

  /**
   * Delete all messages (cleanup for deployment)
   */
  async deleteAllMessages(): Promise<number> {
    const result = await this.collection.deleteMany({});
    return result.deletedCount;
  }

  /**
   * Check if a duplicate message exists
   */
  async checkDuplicateMessage(senderId: string, receiverId: string, timestamp: number): Promise<boolean> {
    const doc = await this.collection.findOne({
      senderId,
      receiverId,
      timestamp
    });

    return doc !== null;
  }

  /**
   * Initialize collection with validation schema and indexes
   */
  async initializeCollection(): Promise<void> {
    const db = getDatabase();
    const isProduction = process.env.NODE_ENV === 'production';

    // Skip validation schema in production (MongoDB Atlas free tier doesn't allow collMod)
    if (!isProduction) {
      // Create collection with validation if it doesn't exist
      const collections = await db.listCollections({ name: 'messages' }).toArray();

      const validationSchema = {
        $jsonSchema: {
          bsonType: 'object',
          required: ['senderId', 'receiverId', 'type', 'timestamp', 'status'],
          properties: {
            senderId: {
              bsonType: 'string',
              description: 'SenderId must be a string'
            },
            receiverId: {
              bsonType: 'string',
              description: 'ReceiverId must be a string'
            },
            text: {
              bsonType: 'string',
              maxLength: 5000,
              description: 'Text must be a string with max 5000 characters'
            },
            imageUrl: {
              bsonType: 'string',
              description: 'ImageUrl must be a string (data URL or http URL)'
            },
            audioUrl: {
              bsonType: 'string',
              description: 'AudioUrl must be a string (data URL or http URL)'
            },
            fileUrl: {
              bsonType: 'string',
              description: 'FileUrl must be a string (data URL or http URL)'
            },
            fileName: {
              bsonType: 'string',
              description: 'FileName must be a string'
            },
            fileType: {
              bsonType: 'string',
              description: 'FileType must be a string (MIME type)'
            },
            type: {
              bsonType: 'string',
              enum: ['text', 'image', 'audio', 'file'],
              description: 'Type must be text, image, audio, or file'
            },
            timestamp: {
              bsonType: 'number',
              minimum: 0,
              description: 'Timestamp must be a positive number (Unix timestamp)'
            },
            status: {
              bsonType: 'string',
              enum: ['sent', 'delivered', 'read'],
              description: 'Status must be sent, delivered, or read'
            },
            groupId: {
              bsonType: 'string',
              description: 'GroupId must be a string (optional)'
            }
          }
        }
      };

      if (collections.length === 0) {
        await db.createCollection('messages', {
          validator: validationSchema
        });
      } else {
        // Update validation for existing collection
        try {
          await db.command({
            collMod: 'messages',
            validator: validationSchema
          });
        } catch (error) {
          console.log('[DB] Warning: Could not update validation schema (likely Atlas free tier limitation)');
        }
      }
    }

    // Create compound indexes for efficient queries (these are allowed in Atlas free tier)
    try {
      await this.collection.createIndex({ senderId: 1, receiverId: 1, timestamp: 1 });
      await this.collection.createIndex({ receiverId: 1, senderId: 1, timestamp: 1 });
      await this.collection.createIndex({ timestamp: -1 });
    } catch (error) {
      console.log('[DB] Warning: Could not create some indexes:', error);
    }

    console.log('[DB] Message collection initialized with indexes');
  }
}
