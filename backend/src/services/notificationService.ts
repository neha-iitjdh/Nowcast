import { getPublisher, getSubscriber } from '../config/redis.js';
import prisma from '../config/database.js';
import { broadcastNotification } from '../websocket/socketHandler.js';
import type { NotificationType } from '@prisma/client';

// Channel names for pub/sub
const CHANNELS = {
  NOTIFICATIONS: 'notifications',
  FEED_UPDATE: 'feed:update',
  POST_UPDATE: 'post:update',
} as const;

interface NotificationPayload {
  type: NotificationType;
  userId: string;
  actorId: string;
  actorName: string;
  postId?: string;
  message: string;
}

interface FeedUpdatePayload {
  type: 'new_post' | 'delete_post';
  postId: string;
  authorId: string;
  followerIds: string[];
}

interface PostUpdatePayload {
  type: 'like' | 'unlike' | 'repost' | 'unrepost' | 'reply';
  postId: string;
  userId: string;
  count?: number;
}

// Initialize subscriber
let isSubscribed = false;

export async function initializeNotificationSubscriber(): Promise<void> {
  if (isSubscribed) return;

  const subscriber = getSubscriber();

  subscriber.subscribe(CHANNELS.NOTIFICATIONS, (err) => {
    if (err) {
      console.error('Failed to subscribe to notifications channel:', err);
      return;
    }
    console.log('Subscribed to notifications channel');
  });

  subscriber.on('message', async (channel, message) => {
    try {
      if (channel === CHANNELS.NOTIFICATIONS) {
        const payload = JSON.parse(message) as NotificationPayload;
        await handleNotification(payload);
      }
    } catch (error) {
      console.error('Error handling pub/sub message:', error);
    }
  });

  isSubscribed = true;
}

async function handleNotification(payload: NotificationPayload): Promise<void> {
  // Store notification in database
  await prisma.notification.create({
    data: {
      type: payload.type,
      userId: payload.userId,
      actorId: payload.actorId,
      actorName: payload.actorName,
      postId: payload.postId,
    },
  });

  // Send real-time notification via WebSocket
  broadcastNotification(payload.userId, {
    type: payload.type,
    message: payload.message,
    postId: payload.postId,
    actorId: payload.actorId,
    actorName: payload.actorName,
  });
}

// ============ Publish Functions ============

export async function publishNotification(payload: NotificationPayload): Promise<void> {
  try {
    const publisher = getPublisher();
    await publisher.publish(CHANNELS.NOTIFICATIONS, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to publish notification:', error);
  }
}

export async function publishFeedUpdate(payload: FeedUpdatePayload): Promise<void> {
  try {
    const publisher = getPublisher();
    await publisher.publish(CHANNELS.FEED_UPDATE, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to publish feed update:', error);
  }
}

export async function publishPostUpdate(payload: PostUpdatePayload): Promise<void> {
  try {
    const publisher = getPublisher();
    await publisher.publish(CHANNELS.POST_UPDATE, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to publish post update:', error);
  }
}

// ============ Notification Helpers ============

export async function notifyLike(
  postAuthorId: string,
  actorId: string,
  actorName: string,
  postId: string
): Promise<void> {
  // Don't notify if user liked their own post
  if (postAuthorId === actorId) return;

  await publishNotification({
    type: 'LIKE',
    userId: postAuthorId,
    actorId,
    actorName,
    postId,
    message: `${actorName} liked your post`,
  });
}

export async function notifyReply(
  postAuthorId: string,
  actorId: string,
  actorName: string,
  postId: string
): Promise<void> {
  if (postAuthorId === actorId) return;

  await publishNotification({
    type: 'REPLY',
    userId: postAuthorId,
    actorId,
    actorName,
    postId,
    message: `${actorName} replied to your post`,
  });
}

export async function notifyRepost(
  postAuthorId: string,
  actorId: string,
  actorName: string,
  postId: string
): Promise<void> {
  if (postAuthorId === actorId) return;

  await publishNotification({
    type: 'REPOST',
    userId: postAuthorId,
    actorId,
    actorName,
    postId,
    message: `${actorName} reposted your post`,
  });
}

export async function notifyFollow(
  followedUserId: string,
  actorId: string,
  actorName: string
): Promise<void> {
  await publishNotification({
    type: 'FOLLOW',
    userId: followedUserId,
    actorId,
    actorName,
    message: `${actorName} started following you`,
  });
}

export async function notifyMention(
  mentionedUserId: string,
  actorId: string,
  actorName: string,
  postId: string
): Promise<void> {
  if (mentionedUserId === actorId) return;

  await publishNotification({
    type: 'MENTION',
    userId: mentionedUserId,
    actorId,
    actorName,
    postId,
    message: `${actorName} mentioned you in a post`,
  });
}

// ============ Get User Notifications ============

export async function getUserNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return {
    data: notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
    unreadCount,
  };
}

export async function markNotificationsAsRead(
  userId: string,
  notificationIds?: string[]
): Promise<void> {
  if (notificationIds && notificationIds.length > 0) {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: { read: true },
    });
  } else {
    // Mark all as read
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
