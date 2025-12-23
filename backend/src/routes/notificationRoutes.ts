import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get user notifications
router.get('/', authenticate, notificationController.getNotifications);

// Mark notifications as read
router.post('/read', authenticate, notificationController.markAsRead);

export default router;
