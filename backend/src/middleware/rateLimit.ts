import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { checkRateLimit } from '../services/cacheService.js';
import { TooManyRequestsError } from '../utils/errors.js';
import { AuthenticatedRequest } from '../types/index.js';

// General rate limiter (fallback using express-rate-limit)
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for post creation
export const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60, // 60 posts per hour
  message: {
    success: false,
    error: 'Too many posts created, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for search
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    success: false,
    error: 'Too many search requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============ Redis-based Rate Limiters ============

interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
  message?: string;
}

/**
 * Create a Redis-based rate limiter middleware
 * Falls back to allowing requests if Redis is unavailable
 */
export function createRedisRateLimiter(action: string, rateLimitConfig: RateLimitConfig) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Use user ID if authenticated, otherwise use IP
      const identifier = req.user?.id || req.ip || 'unknown';

      const result = await checkRateLimit(
        identifier,
        action,
        rateLimitConfig.limit,
        rateLimitConfig.windowSeconds
      );

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', rateLimitConfig.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + result.resetIn);

      if (!result.allowed) {
        res.setHeader('Retry-After', result.resetIn);
        throw new TooManyRequestsError(
          rateLimitConfig.message || 'Too many requests, please try again later'
        );
      }

      next();
    } catch (error) {
      if (error instanceof TooManyRequestsError) {
        next(error);
      } else {
        // Log error but allow request through (fail open)
        console.error('Redis rate limit error:', error);
        next();
      }
    }
  };
}

// Redis-based rate limiters
export const redisPostLimiter = createRedisRateLimiter('post:create', {
  limit: 60,
  windowSeconds: 3600, // 1 hour
  message: 'You have reached the posting limit. Please try again later.',
});

export const redisLikeLimiter = createRedisRateLimiter('like', {
  limit: 200,
  windowSeconds: 3600, // 1 hour
  message: 'You have reached the like limit. Please try again later.',
});

export const redisFollowLimiter = createRedisRateLimiter('follow', {
  limit: 100,
  windowSeconds: 3600, // 1 hour
  message: 'You have reached the follow limit. Please try again later.',
});

export const redisSearchLimiter = createRedisRateLimiter('search', {
  limit: 60,
  windowSeconds: 60, // 1 minute
  message: 'Too many search requests. Please slow down.',
});

export const redisApiLimiter = createRedisRateLimiter('api', {
  limit: 1000,
  windowSeconds: 900, // 15 minutes
  message: 'API rate limit exceeded. Please try again later.',
});
