import { Router } from 'express';
import { requireAuth } from '../../auth/auth.middleware.js';
import { submitMessageFeedback, editMessage, deleteMessage } from './messages.controller.js';

const router = Router();

router.use(requireAuth);
router.post('/:id/feedback', submitMessageFeedback);
router.patch('/:id', editMessage);
router.delete('/:id', deleteMessage);

export default router;
