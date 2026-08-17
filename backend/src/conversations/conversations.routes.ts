import { Router } from 'express';
import {
  getConversations,
  createConversation,
  getConversationById,
  updateConversation,
  deleteConversation,
  bulkDeleteConversations,
  deleteAllConversations,
  toggleArchiveConversation,
  togglePinConversation,
  exportConversation,
  regenerateResponse,
  getMessages,
} from './conversations.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getConversations);
router.post('/', createConversation);
router.delete('/bulk', bulkDeleteConversations);
router.delete('/all', deleteAllConversations);

router.get('/:id', getConversationById);
router.patch('/:id', updateConversation);
router.delete('/:id', deleteConversation);

router.patch('/:id/archive', toggleArchiveConversation);
router.patch('/:id/pin', togglePinConversation);
router.get('/:id/export', exportConversation);
router.post('/:id/regenerate', regenerateResponse);
router.get('/:id/messages', getMessages);

export default router;
