import { Router } from 'express';
import * as feedController from '../controllers/feedController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validate.js';
import { paginationSchema } from '../utils/validation.js';

const router = Router();

// Home feed (authenticated - posts from followed users)
router.get(
  '/home',
  authenticate,
  validateQuery(paginationSchema),
  feedController.getHomeFeed
);

// Explore feed (public - all posts)
router.get(
  '/explore',
  optionalAuth,
  validateQuery(paginationSchema),
  feedController.getExploreFeed
);

// Trending posts
router.get('/trending', optionalAuth, feedController.getTrendingPosts);

export default router;
