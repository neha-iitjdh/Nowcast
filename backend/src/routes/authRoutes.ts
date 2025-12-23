import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { registerSchema, loginSchema, updateUserSchema } from '../utils/validation.js';

const router = Router();

// Public routes
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  authController.login
);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.patch(
  '/me',
  authenticate,
  validateBody(updateUserSchema),
  authController.updateMe
);

// User profile (public, but with optional auth for follow status)
router.get('/users/:username', optionalAuth, authController.getUser);

export default router;
