import prisma from '../config/database.js';
import { PaginationInput } from '../utils/validation.js';
import { encodeCursor, parseCursor } from '../utils/helpers.js';

export async function getHomeFeed(
  userId: string,
  pagination: PaginationInput
) {
  const { limit, cursor } = pagination;
  const cursorData = parseCursor(cursor);

  // Get list of users this user follows
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);
  // Include user's own posts in feed
  followingIds.push(userId);

  const posts = await prisma.post.findMany({
    where: {
      authorId: { in: followingIds },
      parentId: null, // Only get top-level posts
      ...(cursorData && {
        OR: [
          { createdAt: { lt: cursorData.createdAt } },
          {
            createdAt: cursorData.createdAt,
            id: { lt: cursorData.id },
          },
        ],
      }),
    },
    take: limit + 1,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      likes: {
        where: { userId },
        select: { id: true },
      },
      reposts: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, -1) : posts;
  const lastItem = items[items.length - 1];

  return {
    data: items.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
      isReposted: post.reposts.length > 0,
      likes: undefined,
      reposts: undefined,
    })),
    pagination: {
      hasMore,
      nextCursor: lastItem ? encodeCursor(lastItem.createdAt, lastItem.id) : undefined,
    },
  };
}

export async function getExploreFeed(pagination: PaginationInput, currentUserId?: string) {
  const { limit, cursor } = pagination;
  const cursorData = parseCursor(cursor);

  const posts = await prisma.post.findMany({
    where: {
      parentId: null, // Only get top-level posts
      ...(cursorData && {
        OR: [
          { createdAt: { lt: cursorData.createdAt } },
          {
            createdAt: cursorData.createdAt,
            id: { lt: cursorData.id },
          },
        ],
      }),
    },
    take: limit + 1,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      likes: currentUserId
        ? {
            where: { userId: currentUserId },
            select: { id: true },
          }
        : false,
      reposts: currentUserId
        ? {
            where: { userId: currentUserId },
            select: { id: true },
          }
        : false,
    },
  });

  const hasMore = posts.length > limit;
  const items = hasMore ? posts.slice(0, -1) : posts;
  const lastItem = items[items.length - 1];

  return {
    data: items.map((post) => ({
      ...post,
      isLiked: currentUserId ? (post.likes as { id: string }[]).length > 0 : false,
      isReposted: currentUserId ? (post.reposts as { id: string }[]).length > 0 : false,
      likes: undefined,
      reposts: undefined,
    })),
    pagination: {
      hasMore,
      nextCursor: lastItem ? encodeCursor(lastItem.createdAt, lastItem.id) : undefined,
    },
  };
}

export async function getTrendingPosts(limit: number = 10, currentUserId?: string) {
  // Get trending posts based on engagement (likes + replies + reposts) in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const posts = await prisma.post.findMany({
    where: {
      createdAt: { gte: oneDayAgo },
      parentId: null,
    },
    take: limit,
    orderBy: [
      { likesCount: 'desc' },
      { repliesCount: 'desc' },
      { repostsCount: 'desc' },
    ],
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      likes: currentUserId
        ? {
            where: { userId: currentUserId },
            select: { id: true },
          }
        : false,
    },
  });

  return posts.map((post) => ({
    ...post,
    isLiked: currentUserId ? (post.likes as { id: string }[]).length > 0 : false,
    likes: undefined,
  }));
}
