import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService.js';
import { AuthenticatedRequest } from '../types/index.js';
import { RegisterInput, LoginInput, UpdateUserInput } from '../utils/validation.js';

export async function register(
  req: Request<unknown, unknown, RegisterInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request<unknown, unknown, LoginInput>,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.login(req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const profile = await authService.getProfile(userId);
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { username } = req.params;
    const currentUserId = req.user?.id;
    const user = await authService.getUserByUsername(username, currentUserId);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id;
    const input = req.body as UpdateUserInput;
    const user = await authService.updateProfile(userId, input);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
