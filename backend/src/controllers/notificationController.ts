import { Response, NextFunction } from 'express';
import * as notificationService from '../services/notificationService.js';
import { AuthenticatedRequest } from '../types/index.js';

export async function getNotifications(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const notifications = await notificationService.getUserNotifications(userId, page, limit);

    res.json({
      success: true,
      ...notifications,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { notificationIds } = req.body as { notificationIds?: string[] };

    await notificationService.markNotificationsAsRead(userId, notificationIds);

    res.json({
      success: true,
      message: 'Notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
}
