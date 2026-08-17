import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/prisma.js';

export const getAdminOverview = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalConversations = await prisma.conversation.count();
    const totalMessages = await prisma.message.count();
    const totalMemories = await prisma.memory.count();
    const totalDocuments = await prisma.document.count();

    const usageAggregate = await prisma.usageLog.aggregate({
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
      },
      _avg: {
        latencyMs: true,
      },
      _count: {
        id: true,
      },
    });

    const recentLogs = await prisma.usageLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalConversations,
          totalMessages,
          totalMemories,
          totalDocuments,
          totalTokens: usageAggregate._sum.totalTokens || 0,
          avgLatencyMs: Math.round(usageAggregate._avg.latencyMs || 0),
          totalAIRequests: usageAggregate._count.id || 0,
        },
        recentLogs,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const whereClause = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          rememberMemory: true,
          defaultModel: true,
          createdAt: true,
          _count: {
            select: {
              conversations: true,
              memories: true,
              documents: true,
            },
          },
        },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminUsageLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.usageLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    res.status(200).json({
      success: true,
      data: { logs },
    });
  } catch (err) {
    next(err);
  }
};
