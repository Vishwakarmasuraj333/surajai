import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../auth/auth.middleware.js';
import { uploadDocument, getDocuments, downloadDocument, deleteDocument } from './documents.controller.js';

const router = Router();
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  storage: multer.memoryStorage(),
});

router.use(requireAuth);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id/download', downloadDocument);
router.delete('/:id', deleteDocument);

export default router;
