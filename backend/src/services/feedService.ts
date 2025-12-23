import prisma from '../config/database.js';
import { PaginationInput } from '../utils/validation.js';
import { encodeCursor, parseCursor } from '../utils/helpers.js';
import * as cacheService from './cacheService.js';

export async function getHomeFeed(
  userId: string,
  pagination: PaginationInput
) {
  const { limit, cursor } = pagination;
  const cursorData = parseCursor(cursor);

  // Try to get cached feed post IDs (only for first page)
  if (!cursor) {
    const cachedPostIds = await cacheService.getCachedFeed(userId);
    if (cachedPostIds && cachedPostIds.length > 0) {
      // Fetch posts by IDs from cache
      const posts = await getPostsByIds(cachedPostIds.slice(0, limit + 1), userId);

      if (posts.length > 0) {
        const hasMore = posts.length > limit;
        const items = hasMore ? posts.slice(0, -1) : posts;
        const lastItem = items[items.length - 1];

        return {
          data: items,
          pagination: {
            hasMore,
            nextCursor: lastItem ? encodeCursor(new Date(lastItem.createdAt), lastItem.id) : undefined,
          },
          cached: true,
        };
      }
    }
  }

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

  const formattedPosts = items.map((post) => ({
    ...post,
    isLiked: post.likes.length > 0,
    isReposted: post.reposts.length > 0,
    likes: undefined,
    reposts: undefined,
  }));

  // Cache the feed post IDs for first page
  if (!cursor && formattedPosts.length > 0) {
    const allPostIds = posts.map(p => p.id);
    await cacheService.cacheFeed(userId, allPostIds);
  }

  return {
    data: formattedPosts,
    pagination: {
      hasMore,
      nextCursor: lastItem ? encodeCursor(lastItem.createdAt, lastItem.id) : undefined,
    },
    cached: false,
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
  // Try cache first
  const cached = await cacheService.getCachedTrending();
  if (cached) {
    const posts = JSON.parse(cached);
    // Add user-specific like status if authenticated
    if (currentUserId && posts.length > 0) {
      const postIds = posts.map((p: { id: string }) => p.id);
      const userLikes = await prisma.like.findMany({
        where: { userId: currentUserId, postId: { in: postIds } },
        select: { postId: true },
      });
      const likedPostIds = new Set(userLikes.map(l => l.postId));
      return posts.map((post: { id: string }) => ({
        ...post,
        isLiked: likedPostIds.has(post.id),
      }));
    }
    return posts;
  }

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

  const formattedPosts = posts.map((post) => ({
    ...post,
    isLiked: currentUserId ? (post.likes as { id: string }[]).length > 0 : false,
    likes: undefined,
  }));

  // Cache trending posts (without user-specific data)
  const postsToCache = posts.map((post) => ({
    ...post,
    isLiked: false,
    likes: undefined,
  }));
  await cacheService.cacheTrending(postsToCache);

  return formattedPosts;
}

// Helper function to get posts by IDs with user interaction status
async function getPostsByIds(postIds: string[], userId: string) {
  const posts = await prisma.post.findMany({
    where: { id: { in: postIds } },
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

  // Maintain original order
  const postMap = new Map(posts.map(p => [p.id, p]));
  const orderedPosts = postIds
    .map(id => postMap.get(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  return orderedPosts.map((post) => ({
    ...post,
    isLiked: post.likes.length > 0,
    isReposted: post.reposts.length > 0,
    likes: undefined,
    reposts: undefined,
  }));
}

// Invalidate feed cache when user follows/unfollows
export async function invalidateUserFeed(userId: string): Promise<void> {
  await cacheService.invalidateFeed(userId);
}

// Invalidate feeds of all followers when a user posts
export async function invalidateFollowerFeeds(authorId: string): Promise<void> {
  const followers = await prisma.follow.findMany({
    where: { followingId: authorId },
    select: { followerId: true },
  });

  const followerIds = followers.map(f => f.followerId);
  followerIds.push(authorId); // Also invalidate author's own feed

  await cacheService.invalidateMultipleFeeds(followerIds);
}
