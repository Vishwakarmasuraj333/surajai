import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from '../auth/auth.routes.js';
import usersRoutes from '../users/users.routes.js';
import chatRoutes from '../chat/chat.routes.js';
import conversationsRoutes from '../conversations/conversations.routes.js';
import memoriesRoutes from '../modules/memories/memories.routes.js';
import documentsRoutes from '../modules/documents/documents.routes.js';
import messagesRoutes from '../modules/messages/messages.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import imagesRoutes from '../modules/images/images.routes.js';
import filesRoutes from '../modules/files/files.routes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/', chatRoutes); // /api/models & /api/chat
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/memories', memoriesRoutes);
router.use('/documents', documentsRoutes);
router.use('/messages', messagesRoutes);
router.use('/admin', adminRoutes);
router.use('/images', imagesRoutes);
router.use('/files', filesRoutes);

export default router;
