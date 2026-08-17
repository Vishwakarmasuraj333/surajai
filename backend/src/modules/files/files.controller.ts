import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { storageProvider } from '../../services/storage/storageProvider.js';

export const downloadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawKey = (req.params as any).fileKey;
    const fileKey = decodeURIComponent(Array.isArray(rawKey) ? rawKey[0] : String(rawKey || ''));
    const filePath = storageProvider.getFilePath(fileKey);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Requested file does not exist or has expired.' },
      });
    }

    const filename = path.basename(filePath);
    res.download(filePath, filename);
  } catch (error) {
    next(error);
  }
};
