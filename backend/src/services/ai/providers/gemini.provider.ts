import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from '../AIProvider.js';
import { AIMessage, ChatCompletionOptions, OnStreamChunk, ProviderName } from '../types.js';
import { AIProviderError } from '../errors.js';
import { env } from '../../../config/env.js';

function sanitizeErrorMessage(rawMessage?: string): string {
  if (!rawMessage) return 'AI Provider Request Failed.';
  let sanitized = rawMessage.replace(/key=[A-Za-z0-9_\-]+/g, 'key=[REDACTED]');
  sanitized = sanitized.replace(/(AIzaSy[A-Za-z0-9_\-]+|AQ\.[A-Za-z0-9_\-]+)/g, '[REDACTED]');

  if (sanitized.includes('404 Not Found') || sanitized.includes('is not found')) {
    return 'Gemini model is unavailable for this API configuration. Please select another configured model.';
  }
  if (sanitized.includes('401') || sanitized.includes('API key not valid')) {
    return 'Gemini API key is invalid or unauthorized. Please check your GEMINI_API_KEY setting.';
  }
  if (sanitized.includes('429') || sanitized.includes('Quota exceeded') || sanitized.includes('RESOURCE_EXHAUSTED')) {
    return 'Gemini API quota or rate limit reached. Please wait a moment before sending another message.';
  }
  if (sanitized.includes('403') || sanitized.includes('PERMISSION_DENIED')) {
    return 'Access denied for Gemini API key. Please verify API key permissions.';
  }

  return sanitized;
}

export function cleanAssistantResponse(text: string): string {
  if (!text) return '';

  let cleaned = text.trim();

  if (cleaned.includes('Final selection:')) {
    cleaned = cleaned.split('Final selection:').pop() || cleaned;
  } else if (cleaned.includes('Final answer:')) {
    cleaned = cleaned.split('Final answer:').pop() || cleaned;
  }

  const lines = cleaned.split('\n');
  const validLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (
      trimmed.startsWith('The user') ||
      trimmed.startsWith('User asks') ||
      trimmed.startsWith('User input') ||
      trimmed.startsWith('Persona:') ||
      trimmed.startsWith('SurajAI') ||
      trimmed.startsWith('Behavior Rules') ||
      trimmed.startsWith('Match language') ||
      trimmed.startsWith('Start response') ||
      trimmed.startsWith('Option 1') ||
      trimmed.startsWith('Option 2') ||
      trimmed.startsWith('Option 3') ||
      trimmed.startsWith('Plan:') ||
      trimmed.startsWith('Possible responses') ||
      trimmed.startsWith('Constraint:') ||
      trimmed.startsWith('Draft:') ||
      (trimmed.startsWith('*   ') && !trimmed.includes('**'))
    ) {
      continue;
    }

    validLines.push(line);
  }

  const result = validLines.join('\n').trim();
  return result.replace(/^"([^"]+)"$/g, '$1').trim();
}

export class GeminiProvider implements AIProvider {
  name: ProviderName = 'gemini';
  private cachedVerifiedModels: string[] | null = null;

  isConfigured(): boolean {
    return Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '');
  }

  private getClient(): GoogleGenerativeAI {
    if (!this.isConfigured()) {
      throw new AIProviderError(
        'Gemini is not configured. Add GEMINI_API_KEY to environment configuration.',
        'PROVIDER_NOT_CONFIGURED',
        'gemini',
        503,
        false
      );
    }
    return new GoogleGenerativeAI(env.GEMINI_API_KEY!);
  }

  /**
   * Diagnostic helper to list models safely without exposing secrets
   */
  async getAvailableModelsFromApi(): Promise<Array<{ id: string; name: string; supportedMethods: string[]; available: boolean }>> {
    if (!this.isConfigured()) return [];
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`);
      if (!res.ok) return [];
      const json = await res.json();
      if (!json.models || !Array.isArray(json.models)) return [];

      return json.models
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => ({
          id: m.name.replace('models/', ''),
          name: m.displayName || m.name,
          supportedMethods: m.supportedGenerationMethods || [],
          available: true,
        }));
    } catch {
      return [];
    }
  }

  private async getVerifiedCandidateNames(requestedName?: string): Promise<string[]> {
    if (!this.cachedVerifiedModels) {
      const apiModels = await this.getAvailableModelsFromApi();
      if (apiModels.length > 0) {
        this.cachedVerifiedModels = apiModels.map((m) => m.id);
      }
    }

    const candidateList: string[] = [];
    const defaultConfig = env.GEMINI_MODEL || 'gemini-1.5-flash';

    if (requestedName) {
      const cleanReq = requestedName.replace('models/', '');
      if (this.cachedVerifiedModels && this.cachedVerifiedModels.includes(cleanReq)) {
        candidateList.push(cleanReq);
      }
    }

    if (this.cachedVerifiedModels && this.cachedVerifiedModels.includes(defaultConfig)) {
      if (!candidateList.includes(defaultConfig)) candidateList.push(defaultConfig);
    }

    if (this.cachedVerifiedModels && this.cachedVerifiedModels.length > 0) {
      for (const m of this.cachedVerifiedModels) {
        if (!candidateList.includes(m)) candidateList.push(m);
      }
    } else {
      const defaults = [defaultConfig, 'gemini-1.5-flash', 'gemini-1.5-pro'];
      for (const d of defaults) {
        if (!candidateList.includes(d)) candidateList.push(d);
      }
    }

    return candidateList;
  }

  async chat(messages: AIMessage[], options?: ChatCompletionOptions): Promise<string> {
    const client = this.getClient();
    const candidateModels = await this.getVerifiedCandidateNames(options?.model);

    const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const enforcedSystem = `${systemMsg}\n\nCRITICAL DIRECTIVE: You are answering the user directly. Start your response IMMEDIATELY with the final answer text. Do NOT write any internal thinking steps, chain-of-thought, evaluation of options, or prompt analysis.`;

    const contents = chatMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          systemInstruction: { role: 'system', parts: [{ text: enforcedSystem }] },
        });

        const result = await model.generateContent({ contents });
        return cleanAssistantResponse(result.response.text());
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }

    const safeMessage = sanitizeErrorMessage(lastError?.message);
    throw new AIProviderError(safeMessage, 'PROVIDER_UNAVAILABLE', 'gemini', 500, true);
  }

  async streamChat(messages: AIMessage[], onChunk: OnStreamChunk, options?: ChatCompletionOptions): Promise<string> {
    const client = this.getClient();
    const candidateModels = await this.getVerifiedCandidateNames(options?.model);

    const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
    const chatMessages = messages.filter((m) => m.role !== 'system');

    const enforcedSystem = `${systemMsg}\n\nCRITICAL DIRECTIVE: You are answering the user directly. Start your response IMMEDIATELY with the final answer text. Do NOT write any internal thinking steps, chain-of-thought, evaluation of options, or prompt analysis.`;

    const contents = chatMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          systemInstruction: { role: 'system', parts: [{ text: enforcedSystem }] },
        });

        const resultStream = await model.generateContentStream({ contents });
        let rawFullText = '';

        for await (const chunk of resultStream.stream) {
          const text = chunk.text();
          if (text) {
            rawFullText += text;
          }
        }

        const cleanedText = cleanAssistantResponse(rawFullText);

        onChunk({
          type: 'text_delta',
          content: cleanedText,
        });

        onChunk({
          type: 'message_complete',
          content: cleanedText,
        });

        return cleanedText;
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }

    const safeMessage = sanitizeErrorMessage(lastError?.message);
    onChunk({
      type: 'error',
      error: {
        code: 'PROVIDER_UNAVAILABLE',
        message: safeMessage,
      },
    });

    throw new AIProviderError(safeMessage, 'PROVIDER_UNAVAILABLE', 'gemini', 500, true);
  }
}
