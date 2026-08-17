import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';

const createMemorySchema = z.object({
  content: z.string().min(1, 'Memory content required').max(1000, 'Memory content too long'),
  category: z.string().optional().default('general'),
  type: z.enum(['PREFERENCE', 'PROFILE', 'GOAL', 'PROJECT', 'FACT', 'INSTRUCTION', 'CONTEXT']).optional().default('FACT'),
  importance: z.number().min(1).max(10).optional().default(5),
});

const updateMemorySchema = z.object({
  content: z.string().min(1).max(1000).optional(),
  category: z.string().optional(),
  type: z.enum(['PREFERENCE', 'PROFILE', 'GOAL', 'PROJECT', 'FACT', 'INSTRUCTION', 'CONTEXT']).optional(),
  importance: z.number().min(1).max(10).optional(),
  archived: z.boolean().optional(),
});

export const getMemories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const search = req.query.search as string;

    const memories = await prisma.memory.findMany({
      where: {
        userId,
        archivedAt: null,
        ...(search ? { content: { contains: search } } : {}),
      },
      orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { rememberMemory: true },
    });

    res.status(200).json({
      success: true,
      data: {
        memories,
        rememberMemory: user?.rememberMemory ?? true,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createMemory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const body = createMemorySchema.parse(req.body);

    const memory = await prisma.memory.create({
      data: {
        userId,
        content: body.content,
        category: body.category,
        type: body.type,
        importance: body.importance,
        source: 'manual',
      },
    });

    res.status(201).json({
      success: true,
      data: { memory },
    });
  } catch (err) {
    next(err);
  }
};

export const updateMemory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const body = updateMemorySchema.parse(req.body);

    const existing = await prisma.memory.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Memory not found' } });
    }

    const memory = await prisma.memory.update({
      where: { id },
      data: {
        ...(body.content ? { content: body.content } : {}),
        ...(body.category ? { category: body.category } : {}),
        ...(body.type ? { type: body.type } : {}),
        ...(body.importance ? { importance: body.importance } : {}),
        ...(body.archived !== undefined ? { archivedAt: body.archived ? new Date() : null } : {}),
      },
    });

    res.status(200).json({
      success: true,
      data: { memory },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteMemory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const existing = await prisma.memory.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Memory not found' } });
    }

    await prisma.memory.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Memory deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const clearAllMemories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await prisma.memory.deleteMany({ where: { userId } });

    res.status(200).json({
      success: true,
      message: 'All memories cleared successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const toggleMemorySetting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { rememberMemory } = z.object({ rememberMemory: z.boolean() }).parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { rememberMemory },
      select: { rememberMemory: true },
    });

    res.status(200).json({
      success: true,
      data: { rememberMemory: user.rememberMemory },
    });
  } catch (err) {
    next(err);
  }
};
