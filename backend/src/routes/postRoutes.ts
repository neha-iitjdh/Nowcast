import { Router } from 'express';
import * as postController from '../controllers/postController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { postLimiter } from '../middleware/rateLimit.js';
import { createPostSchema, updatePostSchema, paginationSchema } from '../utils/validation.js';

const router = Router();

// Create post (authenticated)
router.post(
  '/',
  authenticate,
  postLimiter,
  validateBody(createPostSchema),
  postController.createPost
);

// Get single post (optional auth for like/repost status)
router.get('/:id', optionalAuth, postController.getPost);

// Update post (authenticated, owner only)
router.patch(
  '/:id',
  authenticate,
  validateBody(updatePostSchema),
  postController.updatePost
);

// Delete post (authenticated, owner only)
router.delete('/:id', authenticate, postController.deletePost);

// Get post replies (optional auth)
router.get(
  '/:id/replies',
  optionalAuth,
  validateQuery(paginationSchema),
  postController.getPostReplies
);

// Get user's posts
router.get(
  '/user/:userId',
  optionalAuth,
  validateQuery(paginationSchema),
  postController.getUserPosts
);

export default router;
