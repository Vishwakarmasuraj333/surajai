import { Router } from 'express';
import { downloadFile } from './files.controller.js';

const router = Router();

// Public file download route (can be accessed by download link)
router.get('/download/:fileKey', downloadFile);

export default router;
