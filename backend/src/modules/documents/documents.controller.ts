import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../db/prisma.js';
import { DocumentProcessor } from '../../services/documents/documentProcessor.js';
import { storageProvider } from '../../services/storage/storageProvider.js';
import { DocumentStatus } from '@prisma/client';

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_FILE', message: 'No file provided in upload request' },
      });
    }

    const savedFileUrl = await storageProvider.uploadFile(file.buffer, file.originalname);

    const doc = await prisma.document.create({
      data: {
        userId,
        name: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype || 'application/octet-stream',
        fileUrl: savedFileUrl,
        status: DocumentStatus.UPLOADING,
      },
    });

    DocumentProcessor.processDocument(doc.id, file.buffer).catch(() => {});

    res.status(201).json({
      success: true,
      data: {
        document: doc,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        fileSize: true,
        mimeType: true,
        status: true,
        chunkCount: true,
        tokenCount: true,
        errorMessage: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: { documents },
    });
  } catch (err) {
    next(err);
  }
};

export const downloadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied' },
      });
    }

    const targetPath = storageProvider.getFilePath(existing.fileUrl);
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'Physical file not found on server' },
      });
    }

    res.setHeader('Content-Type', existing.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${existing.name}"`);
    fs.createReadStream(targetPath).pipe(res);
  } catch (err) {
    next(err);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied' },
      });
    }

    // Delete physical file on disk
    await storageProvider.deleteFile(existing.fileUrl);

    // Delete document DB record (cascades to chunks)
    await prisma.document.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Document and physical file deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
