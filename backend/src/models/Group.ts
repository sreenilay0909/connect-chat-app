import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../config/db';

export interface Group {
    id: string;
    name: string;
    avatar?: string;
    adminId: string;
    memberIds: string[];
    createdAt: number;
}

interface GroupDocument {
    _id: ObjectId;
    name: string;
    avatar?: string;
    adminId: string;
    memberIds: string[];
    createdAt: number;
}

export class GroupModel {
    private collection: Collection<GroupDocument>;

    constructor() {
        const db = getDatabase();
        this.collection = db.collection<GroupDocument>('groups');
    }

    private transformDocument(doc: GroupDocument): Group {
        return {
            id: doc._id.toString(),
            name: doc.name,
            avatar: doc.avatar,
            adminId: doc.adminId,
            memberIds: doc.memberIds,
            createdAt: doc.createdAt,
        };
    }

    async createGroup(groupData: Omit<Group, 'id'>): Promise<Group> {
        const groupDoc: Omit<GroupDocument, '_id'> = {
            name: groupData.name,
            avatar: groupData.avatar,
            adminId: groupData.adminId,
            memberIds: groupData.memberIds,
            createdAt: groupData.createdAt,
        };

        const result = await this.collection.insertOne(groupDoc as GroupDocument);

        return {
            id: result.insertedId.toString(),
            ...groupData,
        };
    }

    async getGroupsForUser(userId: string): Promise<Group[]> {
        const docs = await this.collection.find({ memberIds: userId }).toArray();
        return docs.map(doc => this.transformDocument(doc));
    }

    async getGroup(groupId: string): Promise<Group | null> {
        try {
            const doc = await this.collection.findOne({ _id: new ObjectId(groupId) });
            return doc ? this.transformDocument(doc) : null;
        } catch (e) {
            return null;
        }
    }

    async deleteGroup(groupId: string): Promise<boolean> {
        const objectId = new ObjectId(groupId);
        const result = await this.collection.deleteOne({ _id: objectId });
        return result.deletedCount === 1;
    }

    async removeUserFromAllGroups(userId: string): Promise<number> {
        const result = await this.collection.updateMany(
            { memberIds: userId },
            { $pull: { memberIds: userId } }
        );
        return result.modifiedCount;
    }

    async getAllGroups(): Promise<Group[]> {
        const docs = await this.collection.find({}).toArray();
        return docs.map(doc => this.transformDocument(doc));
    }

    async deleteAllGroups(): Promise<number> {
        const result = await this.collection.deleteMany({});
        return result.deletedCount;
    }

    async addMemberToGroup(groupId: string, userId: string): Promise<boolean> {
        const objectId = new ObjectId(groupId);
        const result = await this.collection.updateOne(
            { _id: objectId },
            { $addToSet: { memberIds: userId } }
        );
        return result.modifiedCount === 1;
    }

    async removeMemberFromGroup(groupId: string, userId: string): Promise<boolean> {
        const objectId = new ObjectId(groupId);
        const result = await this.collection.updateOne(
            { _id: objectId },
            { $pull: { memberIds: userId } }
        );
        return result.modifiedCount === 1;
    }

    async initializeCollection(): Promise<void> {
        const db = getDatabase();
        const isProduction = process.env.NODE_ENV === 'production';

        // Skip validation schema in production (MongoDB Atlas free tier doesn't allow collMod)
        if (!isProduction) {
            const collections = await db.listCollections({ name: 'groups' }).toArray();

            if (collections.length === 0) {
                await db.createCollection('groups', {
                    validator: {
                        $jsonSchema: {
                            bsonType: 'object',
                            required: ['name', 'adminId', 'memberIds', 'createdAt'],
                            properties: {
                                name: { bsonType: 'string' },
                                adminId: { bsonType: 'string' },
                                memberIds: { bsonType: 'array', items: { bsonType: 'string' } },
                                createdAt: { bsonType: 'number' }
                            }
                        }
                    }
                });
            }
        }

        // Create indexes (these are allowed in Atlas free tier)
        try {
            await this.collection.createIndex({ adminId: 1 });
            await this.collection.createIndex({ memberIds: 1 });
            await this.collection.createIndex({ createdAt: -1 });
        } catch (error) {
            console.log('[DB] Warning: Could not create some indexes:', error);
        }

        console.log('[DB] Group collection initialized with indexes');
    }
}
