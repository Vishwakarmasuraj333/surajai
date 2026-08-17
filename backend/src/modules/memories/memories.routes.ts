import { Router } from 'express';
import { requireAuth } from '../../auth/auth.middleware.js';
import {
  getMemories,
  createMemory,
  updateMemory,
  deleteMemory,
  clearAllMemories,
  toggleMemorySetting,
} from './memories.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getMemories);
router.post('/', createMemory);
router.patch('/setting', toggleMemorySetting);
router.patch('/:id', updateMemory);
router.delete('/:id', deleteMemory);
router.delete('/', clearAllMemories);

export default router;
