import { prisma } from '../../db/prisma.js';
import { AIService } from '../ai/AIService.js';
import { logger } from '../../utils/logger.js';

export class ConversationSummarizer {
  /**
   * Check conversation length and update summary if messages exceed 15
   */
  static async checkAndSummarize(userId: string, conversationId: string): Promise<void> {
    try {
      const messageCount = await prisma.message.count({
        where: { conversationId },
      });

      if (messageCount < 15) return;

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { summary: true },
      });

      // Fetch early messages to compress
      const olderMessages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: messageCount - 6,
      });

      if (olderMessages.length < 6) return;

      const formatted = olderMessages.map((m: any) => `${m.role}: ${m.content}`).join('\n');

      const summaryPrompt = `Summarize the key background points, context, user goals, and assistant answers from this past conversation history:
${formatted}

Keep summary concise under 150 words. Focus strictly on essential facts.`;

      const newSummary = await AIService.chat(userId, [
        { role: 'system', content: 'You are a precise conversation summarizer.' },
        { role: 'user', content: summaryPrompt },
      ], { temperature: 0.2 });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { summary: newSummary.trim() },
      });

      logger.info(`[ConversationSummarizer] Updated summary for conversation ${conversationId}`);
    } catch (err: any) {
      logger.warn('[ConversationSummarizer] Summarization skipped:', err.message);
    }
  }
}
