import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { updateProfileSchema } from '../auth/auth.validation.js';
import { AuthService } from '../auth/auth.service.js';
import { storageProvider } from '../services/storage/storageProvider.js';

const updateSettingsSchema = z.object({
  rememberMemory: z.boolean().optional(),
  defaultModel: z.string().optional(),
  responseStyle: z.string().optional(),
  speechVoice: z.string().optional(),
});

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const user = await AuthService.getCurrentUser(req.user.id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const validated = updateProfileSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: validated,
    });

    res.status(200).json({
      success: true,
      data: {
        user: AuthService.sanitizeUser(updatedUser),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_FILE', message: 'No avatar file uploaded' } });
    }

    const avatarUrl = await storageProvider.uploadFile(file.buffer, file.originalname);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });

    res.status(200).json({
      success: true,
      data: { avatar: user.avatar },
    });
  } catch (err) {
    next(err);
  }
};

export const getActiveSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const sessions = await prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: { sessions },
    });
  } catch (err) {
    next(err);
  }
};

export const revokeSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const sessionId = req.params.id as string;

    const existing = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found or access denied' } });
    }

    await prisma.session.delete({ where: { id: sessionId } });

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const revokeOtherSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    await prisma.session.deleteMany({
      where: { userId },
    });

    res.status(200).json({
      success: true,
      message: 'All other active sessions revoked successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        rememberMemory: true,
        defaultModel: true,
        responseStyle: true,
        speechVoice: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const body = updateSettingsSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: body,
      select: {
        rememberMemory: true,
        defaultModel: true,
        responseStyle: true,
        speechVoice: true,
      },
    });

    res.status(200).json({
      success: true,
      data: { settings: user },
    });
  } catch (err) {
    next(err);
  }
};

export const exportUserData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, rememberMemory: true, createdAt: true },
    });

    const conversations = await prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          select: { id: true, role: true, content: true, createdAt: true },
        },
      },
    });

    const memories = await prisma.memory.findMany({ where: { userId } });
    const documents = await prisma.document.findMany({
      where: { userId },
      select: { id: true, name: true, fileSize: true, mimeType: true, status: true, createdAt: true },
    });

    res.status(200).json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        profile,
        conversations,
        memories,
        documents,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId } }),
      prisma.memory.deleteMany({ where: { userId } }),
      prisma.document.deleteMany({ where: { userId } }),
      prisma.usageLog.deleteMany({ where: { userId } }),
      prisma.conversation.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      message: 'Account and associated data deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
