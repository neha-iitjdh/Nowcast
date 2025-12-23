import { Router } from 'express';
import * as interactionController from '../controllers/interactionController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Like/Unlike
router.post('/posts/:postId/like', authenticate, interactionController.likePost);
router.delete('/posts/:postId/like', authenticate, interactionController.unlikePost);

// Get post likes
router.get('/posts/:postId/likes', interactionController.getPostLikes);

// Repost/Unrepost
router.post('/posts/:postId/repost', authenticate, interactionController.repost);
router.delete('/posts/:postId/repost', authenticate, interactionController.unrepost);

// Follow/Unfollow
router.post('/users/:userId/follow', authenticate, interactionController.followUser);
router.delete('/users/:userId/follow', authenticate, interactionController.unfollowUser);

// Get followers/following
router.get('/users/:userId/followers', interactionController.getFollowers);
router.get('/users/:userId/following', interactionController.getFollowing);

export default router;
