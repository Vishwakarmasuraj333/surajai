import { ProviderRegistry } from './providerRegistry.js';
import { AIMessage, ChatCompletionOptions, OnStreamChunk } from './types.js';
import { prisma } from '../../db/prisma.js';
import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

export class AIService {
  static async chat(
    userId: string,
    messages: AIMessage[],
    options?: ChatCompletionOptions
  ): Promise<string> {
    const modelId = options?.model || env.GEMINI_MODEL || 'gemini-1.5-flash';
    const { provider, model } = ProviderRegistry.resolveProviderForModel(modelId);

    const startTime = Date.now();

    try {
      const responseText = await provider.chat(messages, {
        ...options,
        model: model.id,
      });

      const totalLatency = Date.now() - startTime;
      const estimatedPromptTokens = Math.ceil(messages.reduce((acc, m) => acc + m.content.length, 0) / 4);
      const estimatedCompletionTokens = Math.ceil(responseText.length / 4);
      const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;

      await prisma.usageLog.create({
        data: {
          userId,
          model: model.id,
          promptTokens: estimatedPromptTokens,
          completionTokens: estimatedCompletionTokens,
          totalTokens,
          latencyMs: totalLatency,
          status: 'success',
        },
      }).catch(() => {});

      return responseText;
    } catch (err: any) {
      const totalLatency = Date.now() - startTime;

      await prisma.usageLog.create({
        data: {
          userId,
          model: model.id,
          status: 'failed',
          error: err.message || 'AI generation failed',
          latencyMs: totalLatency,
        },
      }).catch(() => {});

      throw err;
    }
  }

  static async streamChat(
    userId: string,
    conversationId: string | undefined,
    messages: AIMessage[],
    onChunk: OnStreamChunk,
    options?: ChatCompletionOptions
  ): Promise<string> {
    const modelId = options?.model || env.GEMINI_MODEL || 'gemini-1.5-flash';
    const { provider, model } = ProviderRegistry.resolveProviderForModel(modelId);

    const startTime = Date.now();
    logger.info(`[AIService] User ${userId} starting stream using ${model.id} (${provider.name})`);

    try {
      const fullResponseText = await provider.streamChat(messages, onChunk, {
        ...options,
        model: model.id,
      });

      const totalLatency = Date.now() - startTime;

      const estimatedPromptTokens = Math.ceil(messages.reduce((acc, m) => acc + m.content.length, 0) / 4);
      const estimatedCompletionTokens = Math.ceil(fullResponseText.length / 4);
      const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;

      await prisma.usageLog.create({
        data: {
          userId,
          conversationId,
          model: model.id,
          promptTokens: estimatedPromptTokens,
          completionTokens: estimatedCompletionTokens,
          totalTokens,
          latencyMs: totalLatency,
          status: 'success',
        },
      }).catch((err: any) => logger.warn('[AIService] Failed to log usage metrics:', err));

      return fullResponseText;
    } catch (err: any) {
      const totalLatency = Date.now() - startTime;

      await prisma.usageLog.create({
        data: {
          userId,
          conversationId,
          model: model.id,
          status: 'failed',
          error: err.message || 'Stream failed',
          latencyMs: totalLatency,
        },
      }).catch(() => {});

      throw err;
    }
  }
}
