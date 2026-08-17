import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { AIService } from '../services/ai/AIService.js';
import { ProviderRegistry } from '../services/ai/providerRegistry.js';
import { AIMessage } from '../services/ai/types.js';
import { MessageRole } from '@prisma/client';
import { ContextEngine } from '../services/context/contextEngine.js';
import { MemoryService } from '../services/memory/memory.service.js';
import { ConversationSummarizer } from '../services/context/conversationSummarizer.js';
import { ToolRegistry } from '../services/tools/toolRegistry.js';
import { ToolCallResult } from '../services/tools/toolTypes.js';
import { SafetyService } from '../services/safety/safety.service.js';

const chatRequestSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1, 'Message content cannot be empty').max(20000, 'Message is too long'),
  model: z.string().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    content: z.string(),
    type: z.string(),
  })).optional(),
});

export const getModels = async (_req: Request, res: Response) => {
  const models = ProviderRegistry.getAvailableModels();
  res.status(200).json({
    success: true,
    data: { models },
  });
};

export const handleChatStream = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const { conversationId: rawConvId, message: rawPromptText, model: requestedModel, attachments } = chatRequestSchema.parse(req.body);
    const userId = req.user.id;

    // ── Safety Validation (before any DB write or AI call) ────────────────────
    const safetyResult = SafetyService.validateChatRequest(rawPromptText);
    if (!safetyResult.safe) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SAFETY_VIOLATION',
          message: safetyResult.reason || '⚠️ This request cannot be processed.',
          category: safetyResult.category,
        },
      });
    }
    // ──────────────────────────────────────────────────────────────────────────

    let promptText = rawPromptText;

    // Append attachments text to prompt if provided
    if (attachments && attachments.length > 0) {
      promptText += '\n\n[ATTACHED FILES]:\n';
      for (const att of attachments) {
        promptText += `\n--- File: ${att.name} (${att.type}) ---\n${att.content}\n`;
      }
    }

    let conversation;

    // 1. Ownership check or conversation creation
    if (rawConvId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: rawConvId },
      });

      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found or access denied.' },
        });
      }
    } else {
      const autoTitle = promptText.trim().split(/\s+/).slice(0, 6).join(' ') || 'New Conversation';
      conversation = await prisma.conversation.create({
        data: {
          userId,
          title: autoTitle,
          model: requestedModel || 'gemini-1.5-pro',
        },
      });
    }

    // 2. Save User Message
    const userMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.USER,
        content: promptText,
      },
    });

    // 3. Load Recent History (Last 10 messages)
    const recentDbMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const formattedHistory: AIMessage[] = recentDbMessages
      .reverse()
      .slice(0, -1)
      .map((m: any) => ({
        role: m.role.toLowerCase() as any,
        content: m.content,
      }));

    // 4. Tool Execution Check
    const executedToolResults: ToolCallResult[] = [];
    const lowerPrompt = promptText.toLowerCase();

    // Check calculator intent
    if (/(\d+\s*[\+\-\*\/\%]\s*\d+|calculate|compute)/i.test(promptText)) {
      const exprMatch = promptText.match(/[\d\.\s\+\-\*\/\(\)\%]+/);
      if (exprMatch && exprMatch[0].trim().length >= 3) {
        const calcRes = await ToolRegistry.executeTool('calculator', { expression: exprMatch[0].trim() }, { userId, conversationId: conversation.id });
        if (calcRes.success) executedToolResults.push(calcRes);
      }
    }

    // Check weather intent
    if (/weather|temperature|forecast/i.test(lowerPrompt)) {
      const locMatch = promptText.match(/weather (?:in|for|at)?\s*([a-zA-Z\s]+)/i);
      const loc = locMatch ? locMatch[1].trim() : 'London';
      const weatherRes = await ToolRegistry.executeTool('weather', { location: loc }, { userId, conversationId: conversation.id });
      if (weatherRes.success) executedToolResults.push(weatherRes);
    }

    // Check time intent
    if (/time|date|timezone|clock/i.test(lowerPrompt)) {
      const timeRes = await ToolRegistry.executeTool('time', {}, { userId, conversationId: conversation.id });
      if (timeRes.success) executedToolResults.push(timeRes);
    }

    // Check web search intent
    if (/search|latest news|who is|what is current|find online/i.test(lowerPrompt)) {
      const searchRes = await ToolRegistry.executeTool('web_search', { query: promptText }, { userId, conversationId: conversation.id });
      if (searchRes.success) executedToolResults.push(searchRes);
    }

    // 5. Assemble Context using ContextEngine
    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const contextOutput = await ContextEngine.buildContext({
      userId,
      userName: req.user.name || dbUser?.name,
      conversationId: conversation.id,
      userPrompt: promptText,
      recentMessages: formattedHistory,
      conversationSummary: conversation.summary,
      toolResults: executedToolResults,
    });

    // 6. Configure SSE Headers (with anti-buffering for instant real-time streaming)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Send initial SSE metadata event
    res.write(`data: ${JSON.stringify({
      type: 'message_start',
      conversationId: conversation.id,
      citations: contextOutput.citations,
      memoriesUsed: contextOutput.memoriesUsed,
      tools: executedToolResults,
    })}\n\n`);
    (res as any).flush?.();

    // 7. Stream AI Response
    let assistantFullResponse = '';

    await AIService.streamChat(
      userId,
      conversation.id,
      contextOutput.messages,
      (chunk) => {
        if (chunk.type === 'text_delta') {
          assistantFullResponse += chunk.content || '';
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          (res as any).flush?.();
        }
      },
      { model: requestedModel || conversation.model }
    );

    // Output Safety Check
    const outputSafety = SafetyService.validateChatResponse(assistantFullResponse);
    if (!outputSafety.safe) {
      assistantFullResponse = outputSafety.reason || "⚠️ The response was blocked because it didn't meet SurajAI's safety requirements.";
    }

    // 8. Save Assistant Message to Database
    const assistantMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.ASSISTANT,
        content: assistantFullResponse,
        model: requestedModel || conversation.model,
        citationSources: contextOutput.citations.length > 0 ? (contextOutput.citations as any) : undefined,
      },
    });

    // Save ToolCalls if executed
    for (const tr of executedToolResults) {
      await prisma.toolCall.create({
        data: {
          messageId: assistantMsg.id,
          toolName: tr.toolName,
          arguments: tr.arguments,
          result: tr.result,
        },
      }).catch(() => {});
    }

    // 9. Update Conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    res.write(`data: ${JSON.stringify({ type: 'message_complete', conversationId: conversation.id, messageId: assistantMsg.id })}\n\n`);
    res.end();

    // 10. Background Async Operations: Memory Extraction & Summarization
    if (outputSafety.safe) {
      MemoryService.extractAndSaveMemories(userId, conversation.id, promptText, assistantFullResponse).catch(() => {});
      ConversationSummarizer.checkAndSummarize(userId, conversation.id).catch(() => {});
    }

  } catch (error: any) {
    const errorMsg = error.message || 'AI Provider Error';

    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: { message: errorMsg } })}\n\n`);
      res.end();
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'PROVIDER_ERROR', message: errorMsg },
      });
    }
  }
};

