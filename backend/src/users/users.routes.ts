import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../auth/auth.middleware.js';
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  getActiveSessions,
  revokeSession,
  revokeOtherSessions,
  getSettings,
  updateSettings,
  exportUserData,
  deleteAccount,
} from './users.controller.js';

const router = Router();
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB avatar limit
  storage: multer.memoryStorage(),
});

router.use(requireAuth);

router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);
router.post('/me/avatar', upload.single('avatar'), uploadAvatar);
router.get('/me/sessions', getActiveSessions);
router.delete('/me/sessions/other', revokeOtherSessions);
router.delete('/me/sessions/:id', revokeSession);

router.get('/me/settings', getSettings);
router.patch('/me/settings', updateSettings);
router.get('/me/export', exportUserData);
router.delete('/me', deleteAccount);

export default router;
