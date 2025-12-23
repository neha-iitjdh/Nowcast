import { getRedis } from '../config/redis.js';
import { config } from '../config/index.js';

const redis = getRedis();

// Cache key prefixes
const KEYS = {
  FEED: 'feed',
  USER: 'user',
  POST: 'post',
  TRENDING: 'trending',
  RATE_LIMIT: 'ratelimit',
} as const;

// Helper to generate cache keys
function key(...parts: (string | number)[]): string {
  return parts.join(':');
}

// ============ Feed Caching ============

export async function getCachedFeed(userId: string): Promise<string[] | null> {
  try {
    const cached = await redis.lrange(key(KEYS.FEED, userId), 0, -1);
    if (cached.length === 0) return null;
    return cached;
  } catch (error) {
    console.error('Redis getCachedFeed error:', error);
    return null;
  }
}

export async function cacheFeed(userId: string, postIds: string[]): Promise<void> {
  try {
    const cacheKey = key(KEYS.FEED, userId);
    const pipeline = redis.pipeline();

    // Delete existing feed
    pipeline.del(cacheKey);

    // Add new post IDs
    if (postIds.length > 0) {
      pipeline.rpush(cacheKey, ...postIds);
    }

    // Set expiration
    pipeline.expire(cacheKey, config.cache.feedTTL);

    await pipeline.exec();
  } catch (error) {
    console.error('Redis cacheFeed error:', error);
  }
}

export async function prependToFeed(userId: string, postId: string): Promise<void> {
  try {
    const cacheKey = key(KEYS.FEED, userId);
    const exists = await redis.exists(cacheKey);

    if (exists) {
      await redis.lpush(cacheKey, postId);
      // Trim to keep feed at reasonable size (e.g., 500 posts)
      await redis.ltrim(cacheKey, 0, 499);
    }
  } catch (error) {
    console.error('Redis prependToFeed error:', error);
  }
}

export async function invalidateFeed(userId: string): Promise<void> {
  try {
    await redis.del(key(KEYS.FEED, userId));
  } catch (error) {
    console.error('Redis invalidateFeed error:', error);
  }
}

export async function invalidateMultipleFeeds(userIds: string[]): Promise<void> {
  try {
    if (userIds.length === 0) return;
    const keys = userIds.map(id => key(KEYS.FEED, id));
    await redis.del(...keys);
  } catch (error) {
    console.error('Redis invalidateMultipleFeeds error:', error);
  }
}

// ============ User Caching ============

export async function getCachedUser(userId: string): Promise<string | null> {
  try {
    return await redis.get(key(KEYS.USER, userId));
  } catch (error) {
    console.error('Redis getCachedUser error:', error);
    return null;
  }
}

export async function cacheUser(userId: string, userData: object): Promise<void> {
  try {
    await redis.setex(
      key(KEYS.USER, userId),
      config.cache.userTTL,
      JSON.stringify(userData)
    );
  } catch (error) {
    console.error('Redis cacheUser error:', error);
  }
}

export async function invalidateUser(userId: string): Promise<void> {
  try {
    await redis.del(key(KEYS.USER, userId));
  } catch (error) {
    console.error('Redis invalidateUser error:', error);
  }
}

// ============ Post Caching ============

export async function getCachedPost(postId: string): Promise<string | null> {
  try {
    return await redis.get(key(KEYS.POST, postId));
  } catch (error) {
    console.error('Redis getCachedPost error:', error);
    return null;
  }
}

export async function cachePost(postId: string, postData: object): Promise<void> {
  try {
    await redis.setex(
      key(KEYS.POST, postId),
      config.cache.feedTTL,
      JSON.stringify(postData)
    );
  } catch (error) {
    console.error('Redis cachePost error:', error);
  }
}

export async function invalidatePost(postId: string): Promise<void> {
  try {
    await redis.del(key(KEYS.POST, postId));
  } catch (error) {
    console.error('Redis invalidatePost error:', error);
  }
}

// ============ Trending Cache ============

export async function getCachedTrending(): Promise<string | null> {
  try {
    return await redis.get(KEYS.TRENDING);
  } catch (error) {
    console.error('Redis getCachedTrending error:', error);
    return null;
  }
}

export async function cacheTrending(posts: object[]): Promise<void> {
  try {
    await redis.setex(KEYS.TRENDING, 300, JSON.stringify(posts)); // 5 min TTL
  } catch (error) {
    console.error('Redis cacheTrending error:', error);
  }
}

// ============ Rate Limiting ============

export async function checkRateLimit(
  identifier: string,
  action: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  try {
    const rateKey = key(KEYS.RATE_LIMIT, action, identifier);
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Remove old entries
    await redis.zremrangebyscore(rateKey, 0, windowStart);

    // Count current requests
    const count = await redis.zcard(rateKey);

    if (count >= limit) {
      // Get oldest entry to calculate reset time
      const oldest = await redis.zrange(rateKey, 0, 0, 'WITHSCORES');
      const resetIn = oldest.length >= 2
        ? Math.ceil((parseInt(oldest[1]!) + windowSeconds * 1000 - now) / 1000)
        : windowSeconds;

      return { allowed: false, remaining: 0, resetIn };
    }

    // Add new request
    await redis.zadd(rateKey, now, `${now}-${Math.random()}`);
    await redis.expire(rateKey, windowSeconds);

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetIn: windowSeconds
    };
  } catch (error) {
    console.error('Redis checkRateLimit error:', error);
    // Fail open - allow request if Redis fails
    return { allowed: true, remaining: limit, resetIn: windowSeconds };
  }
}

// ============ Cache Statistics ============

export async function getCacheStats(): Promise<{
  feedKeys: number;
  userKeys: number;
  postKeys: number;
}> {
  try {
    const [feedKeys, userKeys, postKeys] = await Promise.all([
      redis.keys(`${KEYS.FEED}:*`),
      redis.keys(`${KEYS.USER}:*`),
      redis.keys(`${KEYS.POST}:*`),
    ]);

    return {
      feedKeys: feedKeys.length,
      userKeys: userKeys.length,
      postKeys: postKeys.length,
    };
  } catch (error) {
    console.error('Redis getCacheStats error:', error);
    return { feedKeys: 0, userKeys: 0, postKeys: 0 };
  }
}
