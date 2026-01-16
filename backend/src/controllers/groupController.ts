import { Request, Response } from 'express';
import { GroupModel } from '../models/Group';
import { UserModel } from '../models/User';
import { MessageModel } from '../models/Message';

export class GroupController {
    private groupModel: GroupModel;
    private userModel: UserModel;
    private messageModel: MessageModel;

    constructor() {
        this.groupModel = new GroupModel();
        this.userModel = new UserModel();
        this.messageModel = new MessageModel();
    }

    createGroup = async (req: Request, res: Response): Promise<void> => {
        try {
            const { name, avatar, adminId, memberIds } = req.body;

            if (!name || !adminId || !memberIds || !Array.isArray(memberIds)) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }

            if (memberIds.length < 2) {
                res.status(400).json({ error: 'Group must have at least 2 members' });
                return;
            }

            const newGroup = await this.groupModel.createGroup({
                name,
                avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
                adminId,
                memberIds,
                createdAt: Date.now(),
            });

            res.status(201).json(newGroup);
        } catch (error) {
            console.error('[GroupController] Error creating group:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getUserGroups = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.query;
            if (!userId || typeof userId !== 'string') {
                res.status(400).json({ error: 'Invalid userId' });
                return;
            }

            const groups = await this.groupModel.getGroupsForUser(userId as string);
            res.status(200).json(groups);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    deleteGroup = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const { userId } = req.body; // User requesting deletion

            if (!userId) {
                res.status(400).json({ error: 'UserId required for verification' });
                return;
            }

            // Ensure id is a string
            const groupId = Array.isArray(id) ? id[0] : id;

            const group = await this.groupModel.getGroup(groupId);
            if (!group) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            // Check permissions: Requesting user must be Group Admin OR Super Admin (admin0909)
            const user = await this.userModel.findUserByEmail('admin0909@gmail.com');
            // const superAdminId = user?.id; // Not needed if we check isAdmin flag

            // Check if requester is super admin by checking if their ID matches the super admin ID
            // OR check if they are the designated group admin
            const isGroupAdmin = group.adminId === userId;

            // Determine if requester is Super Admin. 
            const requestingUser = await this.userModel.findUserById(userId);
            const isSuperAdmin = requestingUser?.isAdmin || requestingUser?.email === 'admin0909@gmail.com';

            if (!isGroupAdmin && !isSuperAdmin) {
                res.status(403).json({ error: 'Not authorized to delete this group' });
                return;
            }

            // Delete the group
            await this.groupModel.deleteGroup(groupId);
            
            // Delete all messages in the group
            await this.messageModel.deleteAllMessagesInGroup(groupId);

            res.status(200).json({ message: 'Group and all messages deleted' });
        } catch (error) {
            console.error('[GroupController] Error deleting group:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    getAllGroups = async (req: Request, res: Response): Promise<void> => {
        try {
            const { adminId } = req.query;

            // Verify admin
            const admin = await this.userModel.findUserById(adminId as string);
            if (!admin?.isAdmin) {
                res.status(403).json({ error: 'Unauthorized', details: 'Only admins can view all groups' });
                return;
            }

            const groups = await this.groupModel.getAllGroups();
            res.status(200).json(groups);
        } catch (error) {
            console.error('[GroupController] Error getting all groups:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    addMember = async (req: Request, res: Response): Promise<void> => {
        try {
            const { groupId } = req.params;
            const { userId, adminId } = req.body;

            // Ensure groupId is a string
            const groupIdStr = Array.isArray(groupId) ? groupId[0] : groupId;

            if (!userId || !adminId) {
                res.status(400).json({ error: 'userId and adminId required' });
                return;
            }

            // Get group
            const group = await this.groupModel.getGroup(groupIdStr);
            if (!group) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            // Verify requester is group admin
            if (group.adminId !== adminId) {
                res.status(403).json({ error: 'Only group admin can add members' });
                return;
            }

            // Add member
            const success = await this.groupModel.addMemberToGroup(groupIdStr, userId);
            if (!success) {
                res.status(400).json({ error: 'User already in group or failed to add' });
                return;
            }

            res.status(200).json({ message: 'Member added successfully' });
        } catch (error) {
            console.error('[GroupController] Error adding member:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    removeMember = async (req: Request, res: Response): Promise<void> => {
        try {
            const { groupId } = req.params;
            const { userId, adminId } = req.body;

            // Ensure groupId is a string
            const groupIdStr = Array.isArray(groupId) ? groupId[0] : groupId;

            if (!userId || !adminId) {
                res.status(400).json({ error: 'userId and adminId required' });
                return;
            }

            // Get group
            const group = await this.groupModel.getGroup(groupIdStr);
            if (!group) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            // Verify requester is group admin
            if (group.adminId !== adminId) {
                res.status(403).json({ error: 'Only group admin can remove members' });
                return;
            }

            // Cannot remove admin
            if (userId === group.adminId) {
                res.status(400).json({ error: 'Cannot remove group admin' });
                return;
            }

            // Remove member
            const success = await this.groupModel.removeMemberFromGroup(groupIdStr, userId);
            if (!success) {
                res.status(400).json({ error: 'Failed to remove member' });
                return;
            }

            res.status(200).json({ message: 'Member removed successfully' });
        } catch (error) {
            console.error('[GroupController] Error removing member:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}
