import { Response, NextFunction } from 'express';
import * as interactionService from '../services/interactionService.js';
import { AuthenticatedRequest } from '../types/index.js';

// Like
export async function likePost(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const username = req.user!.username;
    const { postId } = req.params;
    await interactionService.likePost(userId, postId, username);
    res.json({
      success: true,
      message: 'Post liked successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function unlikePost(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { postId } = req.params;
    await interactionService.unlikePost(userId, postId);
    res.json({
      success: true,
      message: 'Post unliked successfully',
    });
  } catch (error) {
    next(error);
  }
}

// Repost
export async function repost(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const username = req.user!.username;
    const { postId } = req.params;
    await interactionService.repost(userId, postId, username);
    res.json({
      success: true,
      message: 'Reposted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function unrepost(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const { postId } = req.params;
    await interactionService.unrepost(userId, postId);
    res.json({
      success: true,
      message: 'Unreposted successfully',
    });
  } catch (error) {
    next(error);
  }
}

// Follow
export async function followUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const followerId = req.user!.id;
    const followerUsername = req.user!.username;
    const { userId } = req.params;
    await interactionService.followUser(followerId, userId, followerUsername);
    res.json({
      success: true,
      message: 'Followed successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function unfollowUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const followerId = req.user!.id;
    const { userId } = req.params;
    await interactionService.unfollowUser(followerId, userId);
    res.json({
      success: true,
      message: 'Unfollowed successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getFollowers(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const followers = await interactionService.getFollowers(userId, page, limit);
    res.json({
      success: true,
      ...followers,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFollowing(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const following = await interactionService.getFollowing(userId, page, limit);
    res.json({
      success: true,
      ...following,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPostLikes(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const likes = await interactionService.getPostLikes(postId, page, limit);
    res.json({
      success: true,
      ...likes,
    });
  } catch (error) {
    next(error);
  }
}
