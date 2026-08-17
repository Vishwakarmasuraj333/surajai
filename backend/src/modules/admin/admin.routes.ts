import { Router } from 'express';
import { requireAuth } from '../../auth/auth.middleware.js';
import { requireAdmin } from '../../auth/admin.middleware.js';
import { getAdminOverview, getAdminUsers, getAdminUsageLogs } from './admin.controller.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/overview', getAdminOverview);
router.get('/users', getAdminUsers);
router.get('/usage', getAdminUsageLogs);

export default router;
