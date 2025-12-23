import { Router } from 'express';
import authRoutes from './authRoutes.js';
import postRoutes from './postRoutes.js';
import feedRoutes from './feedRoutes.js';
import interactionRoutes from './interactionRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/feed', feedRoutes);
router.use('/', interactionRoutes);

export default router;
