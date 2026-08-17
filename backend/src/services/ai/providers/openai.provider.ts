import OpenAI from 'openai';
import { AIProvider } from '../AIProvider.js';
import { AIMessage, ChatCompletionOptions, OnStreamChunk, ProviderName } from '../types.js';
import { AIProviderError } from '../errors.js';
import { env } from '../../../config/env.js';
import { cleanAssistantResponse } from './gemini.provider.js';

function sanitizeOpenAIError(rawMessage?: string): string {
  if (!rawMessage) return 'OpenAI Provider Request Failed.';
  let sanitized = rawMessage.replace(/sk-[A-Za-z0-9_\-]+/g, 'sk-[REDACTED]');

  if (sanitized.includes('401') || sanitized.includes('Incorrect API key')) {
    return 'OpenAI API key is invalid or unauthorized. Please check your OPENAI_API_KEY setting.';
  }
  if (sanitized.includes('429') || sanitized.includes('Rate limit') || sanitized.includes('insufficient_quota')) {
    return 'OpenAI API quota or rate limit reached. Please check your account quota.';
  }
  if (sanitized.includes('404') || sanitized.includes('model_not_found')) {
    return 'OpenAI model is unavailable for this API configuration. Please select another configured model.';
  }

  return sanitized;
}

export class OpenAIProvider implements AIProvider {
  name: ProviderName = 'openai';

  isConfigured(): boolean {
    return Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim() !== '');
  }

  private getClient(): OpenAI {
    if (!this.isConfigured()) {
      throw new AIProviderError(
        'OpenAI is not configured. Add OPENAI_API_KEY to server environment.',
        'PROVIDER_NOT_CONFIGURED',
        'openai',
        503,
        false
      );
    }
    return new OpenAI({ apiKey: env.OPENAI_API_KEY! });
  }

  async chat(messages: AIMessage[], options?: ChatCompletionOptions): Promise<string> {
    const client = this.getClient();
    const modelId = options?.model || 'gpt-4o';

    const formattedMessages = messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    try {
      const response = await client.chat.completions.create({
        model: modelId,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
      });

      const rawText = response.choices[0]?.message?.content || '';
      return cleanAssistantResponse(rawText);
    } catch (err: any) {
      const safeMessage = sanitizeOpenAIError(err?.message);
      throw new AIProviderError(safeMessage, 'PROVIDER_UNAVAILABLE', 'openai', 500, true);
    }
  }

  async streamChat(messages: AIMessage[], onChunk: OnStreamChunk, options?: ChatCompletionOptions): Promise<string> {
    const client = this.getClient();
    const modelId = options?.model || 'gpt-4o';

    const formattedMessages = messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    try {
      const stream = await client.chat.completions.create({
        model: modelId,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        stream: true,
      });

      let fullText = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullText += content;
          onChunk({
            type: 'text_delta',
            content,
          });
        }
      }

      const cleanedText = cleanAssistantResponse(fullText);

      onChunk({
        type: 'message_complete',
        content: cleanedText,
      });

      return cleanedText;
    } catch (err: any) {
      const safeMessage = sanitizeOpenAIError(err?.message);
      onChunk({
        type: 'error',
        error: {
          code: 'PROVIDER_UNAVAILABLE',
          message: safeMessage,
        },
      });

      throw new AIProviderError(safeMessage, 'PROVIDER_UNAVAILABLE', 'openai', 500, true);
    }
  }
}
