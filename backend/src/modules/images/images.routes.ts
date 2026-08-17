import { Router } from 'express';
import { requireAuth } from '../../auth/auth.middleware.js';
import {
  generateImage,
  getImages,
  getImageById,
  downloadImage,
  deleteImage,
  bulkDeleteImages,
  regenerateImage,
  editImagePrompt,
} from './images.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/generate', generateImage);
router.get('/', getImages);
router.post('/bulk-delete', bulkDeleteImages);
router.get('/:id', getImageById);
router.get('/:id/download', downloadImage);
router.delete('/:id', deleteImage);
router.post('/:id/regenerate', regenerateImage);
router.post('/:id/edit', editImagePrompt);

export default router;
