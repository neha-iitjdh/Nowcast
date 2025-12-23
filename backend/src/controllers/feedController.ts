import { Response, NextFunction } from 'express';
import * as feedService from '../services/feedService.js';
import { AuthenticatedRequest } from '../types/index.js';
import { PaginationInput } from '../utils/validation.js';

export async function getHomeFeed(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const pagination = req.query as unknown as PaginationInput;
    const feed = await feedService.getHomeFeed(userId, pagination);
    res.json({
      success: true,
      ...feed,
    });
  } catch (error) {
    next(error);
  }
}

export async function getExploreFeed(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const currentUserId = req.user?.id;
    const pagination = req.query as unknown as PaginationInput;
    const feed = await feedService.getExploreFeed(pagination, currentUserId);
    res.json({
      success: true,
      ...feed,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTrendingPosts(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const currentUserId = req.user?.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const posts = await feedService.getTrendingPosts(limit, currentUserId);
    res.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    next(error);
  }
}
