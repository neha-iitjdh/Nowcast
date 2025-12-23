import { Response, NextFunction } from 'express';
import * as postService from '../services/postService.js';
import { AuthenticatedRequest } from '../types/index.js';
import { CreatePostInput, UpdatePostInput, PaginationInput } from '../utils/validation.js';

export async function createPost(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const input = req.body as CreatePostInput;
    const post = await postService.createPost(userId, input);
    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPost(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const post = await postService.getPostById(id, currentUserId);
    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePost(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const input = req.body as UpdatePostInput;
    const post = await postService.updatePost(id, userId, input);
    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePost(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    await postService.deletePost(id, userId);
    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getPostReplies(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const pagination = req.query as unknown as PaginationInput;
    const replies = await postService.getPostReplies(id, pagination, currentUserId);
    res.json({
      success: true,
      ...replies,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserPosts(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const pagination = req.query as unknown as PaginationInput;
    const posts = await postService.getUserPosts(userId, pagination, currentUserId);
    res.json({
      success: true,
      ...posts,
    });
  } catch (error) {
    next(error);
  }
}
