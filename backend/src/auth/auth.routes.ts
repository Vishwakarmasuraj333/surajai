import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  refresh,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  googleAuth,
} from './auth.controller.js';
import { requireAuth } from './auth.middleware.js';

const router = Router();

// Strict Auth Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/refresh', refresh);
router.post('/logout', logout);

router.get('/me', requireAuth, getMe);
router.patch('/password', requireAuth, changePassword);

router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

export default router;
