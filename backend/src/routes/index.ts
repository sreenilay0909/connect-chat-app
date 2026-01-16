import { Router, Request, Response } from 'express';
import { UserController } from '../controllers/userController';
import { MessageController } from '../controllers/messageController';

import { GroupController } from '../controllers/groupController';

const router = Router();

// Lazy-load controllers (initialized after database connection)
let userController: UserController | null = null;
let messageController: MessageController | null = null;
let groupController: GroupController | null = null;

export function initializeRoutes() {
  userController = new UserController();
  messageController = new MessageController();
  groupController = new GroupController();
  console.log('[Routes] Controllers initialized');
}

// User routes
router.post('/users', (req: Request, res: Response) => {
  if (!userController) {
    res.status(503).json({ error: 'Service unavailable', details: 'Server is initializing' });
    return;
  }
  userController.registerUser(req, res);
});

router.get('/users', (req: Request, res: Response) => {
  if (!userController) {
    res.status(503).json({ error: 'Service unavailable', details: 'Server is initializing' });
    return;
  }
  userController.getUsers(req, res);
});

router.put('/users/:id', (req: Request, res: Response) => {
  if (!userController) {
    res.status(503).json({ error: 'Service unavailable', details: 'Server is initializing' });
    return;
  }
  userController.updateUser(req, res);
});

// Message routes
router.post('/messages', (req: Request, res: Response) => {
  if (!messageController) {
    res.status(503).json({ error: 'Service unavailable', details: 'Server is initializing' });
    return;
  }
  messageController.sendMessage(req, res);
});

router.get('/messages', (req: Request, res: Response) => {
  if (!messageController) {
    res.status(503).json({ error: 'Service unavailable', details: 'Server is initializing' });
    return;
  }
  messageController.getMessages(req, res);
});

router.put('/messages/:id', (req: Request, res: Response) => {
  if (!messageController) {
    res.status(503).json({ error: 'Service unavailable', details: 'Server is initializing' });
    return;
  }
  messageController.updateMessageStatus(req, res);
});

router.patch('/messages/:id', (req: Request, res: Response) => {
  if (!messageController) {
    res.status(503).json({ error: 'Service unavailable', details: 'Server is initializing' });
    return;
  }
  messageController.editMessage(req, res);
});

router.delete('/messages/:id', (req: Request, res: Response) => {
  if (!messageController) {
    res.status(503).json({ error: 'Service unavailable', details: 'Server is initializing' });
    return;
  }
  messageController.deleteMessage(req, res);
});


// Group routes
router.post('/groups', (req: Request, res: Response) => {
  if (!groupController) {
    res.status(503).json({ error: 'Service unavailable' });
    return;
  }
  groupController.createGroup(req, res);
});

router.get('/groups', (req: Request, res: Response) => {
  if (!groupController) {
    res.status(503).json({ error: 'Service unavailable' });
    return;
  }
  groupController.getUserGroups(req, res);
});

router.get('/groups/all', (req: Request, res: Response) => {
  if (!groupController) {
    res.status(503).json({ error: 'Service unavailable' });
    return;
  }
  groupController.getAllGroups(req, res);
});

router.delete('/groups/:id', (req: Request, res: Response) => {
  if (!groupController) {
    res.status(503).json({ error: 'Service unavailable' });
    return;
  }
  groupController.deleteGroup(req, res);
});

router.post('/groups/:groupId/members', (req: Request, res: Response) => {
  if (!groupController) {
    res.status(503).json({ error: 'Service unavailable' });
    return;
  }
  groupController.addMember(req, res);
});

router.delete('/groups/:groupId/members', (req: Request, res: Response) => {
  if (!groupController) {
    res.status(503).json({ error: 'Service unavailable' });
    return;
  }
  groupController.removeMember(req, res);
});


router.delete('/users/:id', (req: Request, res: Response) => {
  if (!userController) {
    res.status(503).json({ error: 'Service unavailable' });
    return;
  }
  userController.deleteUser(req, res);
});

router.post('/users/:id/ban', (req: Request, res: Response) => {
  if (!userController) {
    res.status(503).json({ error: 'Service unavailable' });
    return;
  }
  userController.banUser(req, res);
});

router.delete('/users/:id/permanent', (req: Request, res: Response) => {
  if (!userController) {
    res.status(503).json({ error: 'Service unavailable' });
    return;
  }
  userController.permanentlyDeleteUser(req, res);
});

router.post('/users/cleanup', (req: Request, res: Response) => {
  if (!userController) {
    res.status(503).json({ error: 'Service unavailable' });
    return;
  }
  userController.cleanupTestData(req, res);
});

export default router;
