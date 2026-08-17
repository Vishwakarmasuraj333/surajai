import { prisma } from '../../db/prisma.js';
import { AIService } from '../ai/AIService.js';
import { logger } from '../../utils/logger.js';

export interface MemoryExtractResult {
  content: string;
  type: 'PREFERENCE' | 'PROFILE' | 'GOAL' | 'PROJECT' | 'FACT' | 'INSTRUCTION' | 'CONTEXT';
  category: string;
  importance: number;
}

export class MemoryService {
  /**
   * Extract potential memories from conversation message exchange
   */
  static async extractAndSaveMemories(
    userId: string,
    conversationId: string,
    userMessage: string,
    assistantMessage: string
  ): Promise<void> {
    try {
      // 1. Check if user enabled memory retention
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { rememberMemory: true },
      });

      if (!user || user.rememberMemory === false) {
        return;
      }

      // Do not attempt memory extraction on short trivial messages
      if (userMessage.trim().length < 15) {
        return;
      }

      const extractionPrompt = `You are an AI Memory Extraction Engine.
Analyze the following exchange between a User and an AI Assistant.
Extract long-term user information such as: PREFERENCE, PROFILE, GOAL, PROJECT, FACT, INSTRUCTION, or CONTEXT.
Rules:
1. Do NOT extract temporary questions or standard conversation.
2. Do NOT extract sensitive numbers (passwords, SSN, API keys, card numbers).
3. If valid memory is found, output JSON array of objects with fields: content, type, category, importance (1-10).
4. If no long-term memory is found, output empty array: []

Exchange:
User: "${userMessage.replace(/"/g, '\\"')}"
Assistant: "${assistantMessage.slice(0, 300).replace(/"/g, '\\"')}"

Output JSON array strictly:`;

      const responseText = await AIService.chat(userId, [
        { role: 'system', content: 'You are a JSON-only extraction model.' },
        { role: 'user', content: extractionPrompt },
      ], { temperature: 0.1 });

      const cleanJson = responseText.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
      const parsed: MemoryExtractResult[] = JSON.parse(cleanJson);

      if (Array.isArray(parsed) && parsed.length > 0) {
        for (const item of parsed) {
          if (!item.content || item.content.length < 5) continue;

          // Deduplication check
          const existing = await prisma.memory.findFirst({
            where: {
              userId,
              content: { contains: item.content.slice(0, 20) },
              archivedAt: null,
            },
          });

          if (!existing) {
            await prisma.memory.create({
              data: {
                userId,
                content: item.content.trim(),
                category: item.category || 'general',
                type: item.type || 'FACT',
                importance: Math.min(Math.max(item.importance || 5, 1), 10),
                source: `conversation:${conversationId}`,
              },
            });
            logger.info(`[MemoryService] Saved new memory for user ${userId}: "${item.content}"`);
          }
        }
      }
    } catch (err: any) {
      logger.warn('[MemoryService] Automatic memory extraction skipped:', err.message);
    }
  }

  /**
   * Retrieve relevant active user memories for prompt context injection
   */
  static async retrieveRelevantMemories(userId: string, promptText: string, limit = 5): Promise<Array<{ id: string; content: string; type: string; importance: number }>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { rememberMemory: true },
      });

      if (!user || user.rememberMemory === false) {
        return [];
      }

      const allMemories = await prisma.memory.findMany({
        where: {
          userId,
          archivedAt: null,
        },
        orderBy: [{ importance: 'desc' }, { createdAt: 'desc' }],
        take: 50,
      });

      if (allMemories.length === 0) return [];

      const keywords = promptText.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      
      const scored = allMemories.map((m) => {
        let score = m.importance || 5;
        const lowerContent = m.content.toLowerCase();
        for (const kw of keywords) {
          if (lowerContent.includes(kw)) {
            score += 10;
          }
        }
        return { memory: m, score };
      });

      scored.sort((a, b) => b.score - a.score);

      const selected = scored.slice(0, limit).map((s) => s.memory);

      // Update lastUsedAt timestamp asynchronously
      const ids = selected.map((m) => m.id);
      if (ids.length > 0) {
        await prisma.memory.updateMany({
          where: { id: { in: ids } },
          data: { lastUsedAt: new Date() },
        }).catch(() => {});
      }

      return selected.map((m) => ({
        id: m.id,
        content: m.content,
        type: m.type,
        importance: m.importance,
      }));
    } catch (err: any) {
      logger.warn('[MemoryService] Memory retrieval failed:', err.message);
      return [];
    }
  }
}
