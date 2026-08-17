import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().nullable().optional(),
});

const updateSettingsSchema = z.object({
  rememberMemory: z.boolean().optional(),
  defaultModel: z.string().optional(),
  responseStyle: z.string().optional(),
  speechVoice: z.string().optional(),
});

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

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const body = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.avatar !== undefined ? { avatar: body.avatar } : {}),
      },
      select: { id: true, name: true, email: true, avatar: true },
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
