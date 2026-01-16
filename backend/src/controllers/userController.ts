import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { MessageModel } from '../models/Message';
import { GroupModel } from '../models/Group';

export class UserController {
  private userModel: UserModel;
  private messageModel: MessageModel;
  private groupModel: GroupModel;

  constructor() {
    this.userModel = new UserModel();
    this.messageModel = new MessageModel();
    this.groupModel = new GroupModel();
  }

  /**
   * Register or retrieve existing user
   * POST /users
   */
  registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, avatar, status } = req.body;

      // Validate required fields
      if (!username || !email) {
        res.status(400).json({
          error: 'Missing required fields',
          details: 'username and email are required'
        });
        return;
      }

      // Check if user already exists
      const existingUser = await this.userModel.findUserByEmail(email);

      if (existingUser) {
        // Allow banned users to login, but return their banned status
        // Frontend will handle showing them a read-only view
        await this.userModel.updateLastSeen(existingUser.id);
        res.status(200).json(existingUser);
        return;
      }

      // Create new user
      const newUser = await this.userModel.createUser({
        username,
        email,
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        status: status || 'Hey there! I am using Connect.',
        lastSeen: Date.now()
      });

      res.status(201).json(newUser);
    } catch (error: any) {
      console.error('[UserController] Error in registerUser:', error);

      // Handle validation errors
      if (error.code === 121) {
        res.status(400).json({
          error: 'Validation error',
          details: error.message
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to register user'
      });
    }
  };

  /**
   * Get all users
   * GET /users
   */
  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { adminId } = req.query;
      
      // If admin is requesting, return all users including admin
      if (adminId) {
        const admin = await this.userModel.findUserById(adminId as string);
        if (admin?.isAdmin) {
          const allUsers = await this.userModel.getAllUsersForAdmin();
          res.status(200).json(allUsers);
          return;
        }
      }
      
      // For regular users, exclude admin and banned users
      const users = await this.userModel.getAllUsers();
      const filteredUsers = users.filter(u => !u.isAdmin);
      res.status(200).json(filteredUsers);
    } catch (error: any) {
      console.error('[UserController] Error in getUsers:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to retrieve users'
      });
    }
  };

  /**
   * Update user profile
   * PUT /users/:id
   */
  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Validate id is a string
      if (typeof id !== 'string') {
        res.status(400).json({
          error: 'Invalid user ID',
          details: 'User ID must be a string'
        });
        return;
      }

      const { username, avatar, status } = req.body;

      // Validate that at least one field is provided
      if (!username && !avatar && !status) {
        res.status(400).json({
          error: 'Missing update fields',
          details: 'At least one of username, avatar, or status must be provided'
        });
        return;
      }

      // Build update object
      const updates: any = {};
      if (username) updates.username = username;
      if (avatar) updates.avatar = avatar;
      if (status) updates.status = status;
      updates.lastSeen = Date.now(); // Always update lastSeen

      const updatedUser = await this.userModel.updateUser(id, updates);

      if (!updatedUser) {
        res.status(404).json({
          error: 'User not found',
          details: `No user found with id: ${id}`
        });
        return;
      }

      res.status(200).json(updatedUser);
    } catch (error: any) {
      console.error('[UserController] Error in updateUser:', error);

      // Handle validation errors
      if (error.code === 121) {
        res.status(400).json({
          error: 'Validation error',
          details: error.message
        });
        return;
      }

      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to update user'
      });
    }
  };
  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (typeof id !== 'string') {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      const success = await this.userModel.deleteUser(id);
      if (!success) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('[UserController] Error in deleteUser:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Ban user (admin only)
   * POST /users/:id/ban
   */
  banUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { adminId } = req.body;

      if (typeof id !== 'string') {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      // Verify admin
      const admin = await this.userModel.findUserById(adminId);
      if (!admin?.isAdmin) {
        res.status(403).json({ error: 'Unauthorized', details: 'Only admins can ban users' });
        return;
      }

      // Ban the user
      const success = await this.userModel.banUser(id);
      if (!success) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Delete all messages from/to this user
      await this.messageModel.deleteAllMessagesFromUser(id);

      // Remove user from all groups
      await this.groupModel.removeUserFromAllGroups(id);

      res.status(200).json({ message: 'User banned and all data removed successfully' });
    } catch (error: any) {
      console.error('[UserController] Error in banUser:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Permanently delete user and all their data (admin only)
   * DELETE /users/:id/permanent
   */
  permanentlyDeleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { adminId } = req.body;

      if (typeof id !== 'string') {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      // Verify admin
      const admin = await this.userModel.findUserById(adminId);
      if (!admin?.isAdmin) {
        res.status(403).json({ error: 'Unauthorized', details: 'Only admins can permanently delete users' });
        return;
      }

      // Delete the user permanently
      const success = await this.userModel.permanentlyDeleteUser(id);
      if (!success) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({ message: 'User permanently deleted' });
    } catch (error: any) {
      console.error('[UserController] Error in permanentlyDeleteUser:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Cleanup all test data except admin (deployment preparation)
   * POST /users/cleanup
   */
  cleanupTestData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { adminId } = req.body;

      // Verify admin
      const admin = await this.userModel.findUserById(adminId);
      if (!admin?.isAdmin) {
        res.status(403).json({ error: 'Unauthorized', details: 'Only admins can cleanup data' });
        return;
      }

      // Delete all users except admin
      const usersDeleted = await this.userModel.deleteAllUsersExceptAdmin();

      // Delete all messages
      const messagesDeleted = await this.messageModel.deleteAllMessages();

      // Delete all groups
      const groupsDeleted = await this.groupModel.deleteAllGroups();

      res.status(200).json({
        message: 'Cleanup completed successfully',
        usersDeleted,
        messagesDeleted,
        groupsDeleted
      });
    } catch (error: any) {
      console.error('[UserController] Error in cleanupTestData:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
