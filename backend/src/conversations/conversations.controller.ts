import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { AIService } from '../services/ai/AIService.js';
import { ContextEngine } from '../services/context/contextEngine.js';
import { AIMessage } from '../services/ai/types.js';

const updateConversationSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  pinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
});

const bulkDeleteSchema = z.object({
  conversationIds: z.array(z.string().uuid()),
});

export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const filter = typeof req.query.filter === 'string' ? req.query.filter : 'active';
    const page = parseInt(typeof req.query.page === 'string' ? req.query.page : '1', 10) || 1;
    const limit = parseInt(typeof req.query.limit === 'string' ? req.query.limit : '50', 10) || 50;
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      userId: req.user.id,
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { summary: { contains: search } },
            ],
          }
        : {}),
    };

    if (filter === 'archived') {
      whereCondition.archivedAt = { not: null };
    } else {
      whereCondition.archivedAt = null;
    }

    if (filter === 'pinned') {
      whereCondition.pinned = true;
    }

    if (filter === 'favorite') {
      whereCondition.isFavorite = true;
    }

    const [conversations, total] = await Promise.all([
      (prisma.conversation as any).findMany({
        where: whereCondition,
        orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
      }),
      (prisma.conversation as any).count({ where: whereCondition }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        conversations,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

    const conversation = await prisma.conversation.create({
      data: {
        userId: req.user.id,
        title: req.body.title || 'New Conversation',
        model: req.body.model || 'gemini-3.6-flash',
      },
    });

    res.status(201).json({
      success: true,
      data: { conversation },
    });
  } catch (error) {
    next(error);
  }
};

export const getConversationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

    const id = req.params.id as string;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { toolCalls: true },
        },
      },
    });

    if (!conversation || conversation.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found or access denied' } });
    }

    res.status(200).json({
      success: true,
      data: { conversation },
    });
  } catch (error) {
    next(error);
  }
};

export const updateConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

    const id = req.params.id as string;
    const updateData = updateConversationSchema.parse(req.body);

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation || conversation.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found or access denied' } });
    }

    const updated = await (prisma.conversation as any).update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      data: { conversation: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

    const id = req.params.id as string;

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation || conversation.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found or access denied' } });
    }

    await prisma.conversation.delete({ where: { id } });

    res.status(200).json({
      success: true,
      data: { message: 'Conversation successfully deleted.' },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

    const { conversationIds } = bulkDeleteSchema.parse(req.body);

    const userConvs = await prisma.conversation.findMany({
      where: {
        id: { in: conversationIds },
        userId: req.user.id,
      },
      select: { id: true },
    });

    const validIds = userConvs.map((c: any) => c.id);

    if (validIds.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'No valid conversations found to delete' } });
    }

    await prisma.conversation.deleteMany({
      where: { id: { in: validIds } },
    });

    res.status(200).json({
      success: true,
      data: { message: `Successfully deleted ${validIds.length} conversations.`, deletedCount: validIds.length },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAllConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

    const result = await prisma.conversation.deleteMany({
      where: { userId: req.user.id },
    });

    res.status(200).json({
      success: true,
      data: { message: 'All conversations successfully deleted.', deletedCount: result.count },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleArchiveConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

    const id = req.params.id as string;
    const conversation = await (prisma.conversation as any).findUnique({ where: { id } });

    if (!conversation || conversation.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found or access denied' } });
    }

    const updated = await (prisma.conversation as any).update({
      where: { id },
      data: {
        archivedAt: conversation.archivedAt ? null : new Date(),
      },
    });

    res.status(200).json({
      success: true,
      data: { conversation: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const togglePinConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

    const id = req.params.id as string;
    const conversation = await (prisma.conversation as any).findUnique({ where: { id } });

    if (!conversation || conversation.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found or access denied' } });
    }

    const updated = await (prisma.conversation as any).update({
      where: { id },
      data: {
        pinned: !conversation.pinned,
      },
    });

    res.status(200).json({
      success: true,
      data: { conversation: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const exportConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

    const id = req.params.id as string;
    const format = typeof req.query.format === 'string' ? req.query.format.toLowerCase() : 'json';

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation || conversation.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found or access denied' } });
    }

    if (format === 'txt' || format === 'text') {
      const textOutput = conversation.messages
        .map((m: any) => `[${m.role}] (${m.createdAt.toISOString()}):\n${m.content}\n`)
        .join('\n----------------------------------------\n\n');

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="conversation-${conversation.id}.txt"`);
      return res.status(200).send(textOutput);
    }

    if (format === 'md' || format === 'markdown') {
      const mdOutput = `# ${conversation.title}\n\n*Exported on ${new Date().toISOString()}*\n\n` +
        conversation.messages
          .map((m: any) => `### ${m.role === 'USER' ? '👤 User' : '🤖 SurajAI'}\n*${m.createdAt.toLocaleString()}*\n\n${m.content}\n`)
          .join('\n---\n\n');

      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="conversation-${conversation.id}.md"`);
      return res.status(200).send(mdOutput);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="conversation-${conversation.id}.json"`);
    return res.status(200).json({
      success: true,
      data: { conversation },
    });
  } catch (error) {
    next(error);
  }
};

export const regenerateResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

    const id = req.params.id as string;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation || conversation.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found or access denied' } });
    }

    const userMessages = conversation.messages.filter((m: any) => m.role === 'USER');
    if (userMessages.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'No user message to regenerate' } });
    }

    const lastUserMsg = userMessages[userMessages.length - 1];

    await prisma.message.deleteMany({
      where: {
        conversationId: id,
        createdAt: { gt: lastUserMsg.createdAt },
      },
    });

    const recentMessages: AIMessage[] = conversation.messages
      .filter((m: any) => m.id !== lastUserMsg.id && m.createdAt < lastUserMsg.createdAt)
      .map((m: any) => ({
        role: m.role.toLowerCase() as 'user' | 'assistant' | 'system' | 'tool',
        content: m.content,
      }));

    const contextOutput = await ContextEngine.buildContext({
      userId: req.user.id,
      conversationId: id,
      userPrompt: lastUserMsg.content,
      recentMessages,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullText = '';

    const assistantContent = await AIService.streamChat(
      req.user.id,
      id,
      contextOutput.messages,
      (chunk) => {
        if (chunk.type === 'text_delta' && chunk.content) {
          fullText += chunk.content;
          res.write(`data: ${JSON.stringify({ type: 'text_delta', content: chunk.content })}\n\n`);
        }
      },
      { model: conversation.model }
    );

    const assistantMsg = await prisma.message.create({
      data: {
        conversationId: id,
        role: 'ASSISTANT',
        content: assistantContent,
        model: conversation.model,
      },
    });

    res.write(`data: ${JSON.stringify({ type: 'message_complete', messageId: assistantMsg.id, content: assistantContent })}\n\n`);
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: { message: (error as Error).message } })}\n\n`);
      res.end();
    }
  }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });

    const id = req.params.id as string;
    const conversation = await prisma.conversation.findUnique({ where: { id } });

    if (!conversation || conversation.userId !== req.user.id) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found or access denied' } });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      include: { toolCalls: true },
    });

    res.status(200).json({
      success: true,
      data: { messages },
    });
  } catch (error) {
    next(error);
  }
};
