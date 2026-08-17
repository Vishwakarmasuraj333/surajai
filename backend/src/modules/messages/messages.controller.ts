import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';

import { SafetyService } from '../../services/safety/safety.service.js';
import { ContextEngine } from '../../services/context/contextEngine.js';
import { AIService } from '../../services/ai/AIService.js';
import { AIMessage } from '../../services/ai/types.js';
import { MessageRole } from '@prisma/client';

const feedbackSchema = z.object({
  feedback: z.enum(['LIKE', 'DISLIKE']),
  reason: z.string().optional(),
});

const editMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty'),
  stream: z.boolean().optional().default(true),
});

export const submitMessageFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { feedback, reason } = feedbackSchema.parse(req.body);

    const message = await prisma.message.findUnique({
      where: { id },
      include: { conversation: true },
    });

    if (!message || message.conversation.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Message not found or access denied' },
      });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: {
        feedback,
        feedbackReason: reason,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        messageId: updated.id,
        feedback: updated.feedback,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const editMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { content, stream } = editMessageSchema.parse(req.body);

    // 1. Ownership & existence validation
    const message = await prisma.message.findUnique({
      where: { id },
      include: { conversation: true },
    });

    if (!message || message.conversation.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Message not found or access denied' },
      });
    }

    // 2. Safety Validation
    const safetyResult = SafetyService.validateChatRequest(content);
    if (!safetyResult.safe) {
      return res.status(400).json({
        success: false,
        error: { code: 'SAFETY_VIOLATION', message: safetyResult.reason || '⚠️ Safety violation' },
      });
    }

    // 3. Record revision history
    await (prisma as any).messageRevision.create({
      data: {
        messageId: message.id,
        content: message.content,
      },
    }).catch(() => {});

    // 4. Update message content in DB
    const updatedUserMsg = await (prisma.message as any).update({
      where: { id },
      data: {
        content,
        editedAt: new Date(),
      },
    });

    // 5. Invalidate/supersede trailing assistant messages following this edited message
    await prisma.message.deleteMany({
      where: {
        conversationId: message.conversationId,
        createdAt: { gt: message.createdAt },
      },
    });

    if (!stream) {
      return res.status(200).json({
        success: true,
        data: { message: updatedUserMsg },
      });
    }

    // 6. Memory & RAG Retrieval + Real AI Provider Stream
    const previousDbMessages = await prisma.message.findMany({
      where: {
        conversationId: message.conversationId,
        createdAt: { lt: message.createdAt },
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    const recentHistory: AIMessage[] = previousDbMessages.map((m) => ({
      role: m.role.toLowerCase() as any,
      content: m.content,
    }));

    const contextOutput = await ContextEngine.buildContext({
      userId,
      conversationId: message.conversationId,
      userPrompt: content,
      recentMessages: recentHistory,
      conversationSummary: message.conversation.summary,
    });

    // 7. SSE Streaming setup
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(`data: ${JSON.stringify({
      type: 'message_start',
      conversationId: message.conversationId,
      citations: contextOutput.citations,
      memoriesUsed: contextOutput.memoriesUsed,
    })}\n\n`);

    let assistantFullResponse = '';

    await AIService.streamChat(
      userId,
      message.conversationId,
      contextOutput.messages,
      (chunk) => {
        if (chunk.type === 'text_delta') {
          assistantFullResponse += chunk.content || '';
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      },
      { model: message.conversation.model }
    );

    // Validate response output safety
    const outputSafety = SafetyService.validateChatResponse(assistantFullResponse);
    if (!outputSafety.safe) {
      assistantFullResponse = outputSafety.reason || "⚠️ Output safety blocked";
    }

    // 8. Save new Assistant message
    const assistantMsg = await prisma.message.create({
      data: {
        conversationId: message.conversationId,
        role: MessageRole.ASSISTANT,
        content: assistantFullResponse,
        model: message.conversation.model,
      },
    });

    res.write(`data: ${JSON.stringify({ type: 'message_complete', conversationId: message.conversationId, messageId: assistantMsg.id })}\n\n`);
    res.end();

  } catch (err) {
    next(err);
  }
};

export const deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const message = await prisma.message.findUnique({
      where: { id },
      include: { conversation: true },
    });

    if (!message || message.conversation.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Message not found or access denied' },
      });
    }

    // Transactional deletion of message and associated toolCalls / revisions
    await prisma.$transaction(async (tx) => {
      await tx.toolCall.deleteMany({ where: { messageId: id } });
      await (tx as any).messageRevision.deleteMany({ where: { messageId: id } });
      await tx.message.delete({ where: { id } });
    });

    res.status(200).json({
      success: true,
      data: { message: 'Message deleted successfully.' },
    });
  } catch (err) {
    next(err);
  }
};

