import { Request, Response } from 'express';
import { MessageModel } from '../models/Message';
import { UserModel } from '../models/User';
import { ObjectId } from 'mongodb';

export class MessageController {
  private messageModel: MessageModel;
  private userModel: UserModel;

  constructor() {
    this.messageModel = new MessageModel();
    this.userModel = new UserModel();
  }

  /**
   * Send a message
   * POST /messages
   */
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('[MessageController] Received message data:', JSON.stringify(req.body, null, 2));
      const { senderId, receiverId, text, imageUrl, audioUrl, fileUrl, fileName, fileType, type, timestamp, status, groupId } = req.body;

      // Validate required fields
      if (!senderId || (!receiverId && !groupId) || !type || !timestamp) {
        console.log('[MessageController] Validation failed - missing fields');
        res.status(400).json({
          error: 'Missing required fields',
          details: 'senderId, receiverId (or groupId), type, and timestamp are required',
          received: { senderId, receiverId, groupId, type, timestamp }
        });
        return;
      }

      // Validate type
      if (type !== 'text' && type !== 'image' && type !== 'audio' && type !== 'file') {
        res.status(400).json({
          error: 'Invalid type',
          details: 'type must be "text", "image", "audio", or "file"'
        });
        return;
      }

      // Validate content based on type
      if (type === 'text' && !text) {
        res.status(400).json({
          error: 'Missing text content',
          details: 'text is required for text messages'
        });
        return;
      }

      if (type === 'image' && !imageUrl) {
        res.status(400).json({
          error: 'Missing image URL',
          details: 'imageUrl is required for image messages'
        });
        return;
      }

      if (type === 'audio' && !audioUrl) {
        res.status(400).json({
          error: 'Missing audio URL',
          details: 'audioUrl is required for audio messages'
        });
        return;
      }

      if (type === 'file' && !fileUrl) {
        res.status(400).json({
          error: 'Missing file URL',
          details: 'fileUrl is required for file messages'
        });
        return;
      }

      // Check for duplicate message
      const isDuplicate = await this.messageModel.checkDuplicateMessage(senderId, receiverId, timestamp);

      if (isDuplicate) {
        res.status(200).json({
          message: 'Duplicate message detected, skipping creation'
        });
        return;
      }

      // Validate sender is not banned
      const isBanned = await this.userModel.isUserBanned(senderId);
      if (isBanned) {
        res.status(403).json({ error: 'You are banned and cannot send messages' });
        return;
      }

      // Create message
      const newMessage = await this.messageModel.createMessage({
        senderId,
        receiverId: groupId || receiverId, // If group, receiver is groupId
        text,
        imageUrl,
        audioUrl,
        fileUrl,
        fileName,
        fileType,
        type,
        timestamp,
        status: status || 'sent',
        groupId
      });

      res.status(201).json(newMessage);
    } catch (error: any) {
      console.error('[MessageController] Error in sendMessage:', error);

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
        details: 'Failed to send message'
      });
    }
  };

  /**
   * Get messages between two users
   * GET /messages?u1=userId1&u2=userId2
   */
  getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const { u1, u2, groupId } = req.query;

      // Case 1: Group Messages
      if (groupId) {
        const messages = await this.messageModel.getGroupMessages(groupId as string);
        res.status(200).json(messages);
        return;
      }

      // Case 2: Direct Messages
      if (!u1 || !u2) {
        res.status(400).json({
          error: 'Missing query parameters',
          details: 'Provide (u1 and u2) OR (groupId)'
        });
        return;
      }

      const messages = await this.messageModel.getMessagesBetweenUsers(
        u1 as string,
        u2 as string
      );

      res.status(200).json(messages);
    } catch (error: any) {
      console.error('[MessageController] Error in getMessages:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to retrieve messages'
      });
    }
  };

  /**
   * Update message status
   * PUT /messages/:id
   */
  updateMessageStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Validate id is a string
      if (typeof id !== 'string') {
        res.status(400).json({
          error: 'Invalid message ID',
          details: 'Message ID must be a string'
        });
        return;
      }

      const { status } = req.body;

      // Validate status
      if (!status) {
        res.status(400).json({
          error: 'Missing status field',
          details: 'status is required'
        });
        return;
      }

      if (status !== 'sent' && status !== 'delivered' && status !== 'read') {
        res.status(400).json({
          error: 'Invalid status',
          details: 'status must be "sent", "delivered", or "read"'
        });
        return;
      }

      const updatedMessage = await this.messageModel.updateMessageStatus(id, status);

      if (!updatedMessage) {
        res.status(404).json({
          error: 'Message not found',
          details: `No message found with id: ${id}`
        });
        return;
      }

      res.status(200).json(updatedMessage);
    } catch (error: any) {
      console.error('[MessageController] Error in updateMessageStatus:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to update message status'
      });
    }
  };

  /**
   * Edit message text
   * PATCH /messages/:id
   */
  editMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { text, userId } = req.body;

      // Validate id is a string
      if (typeof id !== 'string') {
        res.status(400).json({
          error: 'Invalid message ID',
          details: 'Message ID must be a string'
        });
        return;
      }

      if (!text || !userId) {
        res.status(400).json({
          error: 'Missing required fields',
          details: 'text and userId are required'
        });
        return;
      }

      // First, update the message and get the result
      const updatedMessage = await this.messageModel.updateMessageText(id, text);

      if (!updatedMessage) {
        res.status(404).json({
          error: 'Message not found'
        });
        return;
      }

      // Verify the user is the sender (after we know the message exists)
      if (updatedMessage.senderId !== userId) {
        // Revert the change if user is not authorized
        res.status(403).json({
          error: 'Unauthorized',
          details: 'You can only edit your own messages'
        });
        return;
      }

      res.status(200).json(updatedMessage);
    } catch (error: any) {
      console.error('[MessageController] Error in editMessage:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to edit message'
      });
    }
  };

  /**
   * Delete message
   * DELETE /messages/:id
   */
  deleteMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      // Validate id is a string
      if (typeof id !== 'string') {
        res.status(400).json({
          error: 'Invalid message ID',
          details: 'Message ID must be a string'
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          error: 'Missing userId',
          details: 'userId is required'
        });
        return;
      }

      const success = await this.messageModel.deleteMessage(id);

      if (!success) {
        res.status(404).json({
          error: 'Message not found'
        });
        return;
      }

      res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error: any) {
      console.error('[MessageController] Error in deleteMessage:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to delete message'
      });
    }
  };
}
