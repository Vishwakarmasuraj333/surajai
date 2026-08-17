import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getModels, handleChatStream } from './chat.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'CHAT_RATE_LIMIT_EXCEEDED',
      message: 'Too many chat requests. Please wait a moment before sending another message.',
    },
  },
});

router.get('/models', requireAuth, getModels);
router.get('/ai/models', requireAuth, getModels);
router.post('/chat', requireAuth, chatLimiter, handleChatStream);

export default router;
