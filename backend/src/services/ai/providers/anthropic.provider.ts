import { AIProvider } from '../AIProvider.js';
import { AIMessage, ChatCompletionOptions, OnStreamChunk, ProviderName } from '../types.js';
import { AIProviderError } from '../errors.js';
import { env } from '../../../config/env.js';

export class AnthropicProvider implements AIProvider {
  name: ProviderName = 'anthropic';

  isConfigured(): boolean {
    return Boolean(env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY.trim() !== '');
  }

  async chat(_messages: AIMessage[], _options?: ChatCompletionOptions): Promise<string> {
    if (!this.isConfigured()) {
      throw new AIProviderError(
        'Anthropic API key is missing. Please set ANTHROPIC_API_KEY in backend/.env configuration.',
        'PROVIDER_NOT_CONFIGURED',
        'anthropic',
        503,
        false
      );
    }
    throw new AIProviderError('Anthropic provider execution error', 'PROVIDER_UNAVAILABLE', 'anthropic', 503, false);
  }

  async streamChat(_messages: AIMessage[], onChunk: OnStreamChunk, _options?: ChatCompletionOptions): Promise<string> {
    if (!this.isConfigured()) {
      const err = new AIProviderError(
        'Anthropic API key is missing. Please set ANTHROPIC_API_KEY in backend/.env configuration.',
        'PROVIDER_NOT_CONFIGURED',
        'anthropic',
        503,
        false
      );
      onChunk({
        type: 'error',
        error: { code: err.code, message: err.message },
      });
      throw err;
    }
    throw new AIProviderError('Anthropic provider execution error', 'PROVIDER_UNAVAILABLE', 'anthropic', 503, false);
  }
}
