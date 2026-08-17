import { AIProvider } from './AIProvider.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { OpenAIProvider } from './providers/openai.provider.js';
import { AnthropicProvider } from './providers/anthropic.provider.js';
import { ModelMetadata, ProviderName } from './types.js';
import { AIProviderError } from './errors.js';

export class ProviderRegistry {
  private static providers: Map<ProviderName, AIProvider> = new Map([
    ['gemini', new GeminiProvider()],
    ['openai', new OpenAIProvider()],
    ['anthropic', new AnthropicProvider()],
  ]);

  private static models: ModelMetadata[] = [
    {
      id: 'gemini-1.5-flash',
      name: 'Google Gemini 1.5 Flash (Fast)',
      provider: 'gemini',
      description: 'Ultra-fast multimodal reasoning & high efficiency generation.',
      isConfigured: true,
      capabilities: { streaming: true, vision: true, tools: true, maxTokens: 8192 },
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Google Gemini 1.5 Pro (Senior)',
      provider: 'gemini',
      description: 'Senior multi-modal reasoning & long-context generation.',
      isConfigured: true,
      capabilities: { streaming: true, vision: true, tools: true, maxTokens: 8192 },
    },
    {
      id: 'gpt-4o',
      name: 'OpenAI GPT-4o (Flagship)',
      provider: 'openai',
      description: 'Flagship multi-modal model for complex tasks and vision.',
      isConfigured: true,
      capabilities: { streaming: true, vision: true, tools: true, maxTokens: 4096 },
    },
    {
      id: 'gpt-4o-mini',
      name: 'OpenAI GPT-4o Mini (Fast)',
      provider: 'openai',
      description: 'Affordable, high-speed lightweight multi-modal model.',
      isConfigured: true,
      capabilities: { streaming: true, vision: true, tools: true, maxTokens: 4096 },
    },
    {
      id: 'claude-3-5-sonnet',
      name: 'Anthropic Claude 3.5 Sonnet',
      provider: 'anthropic',
      description: 'Superior coding, reasoning, and technical analysis.',
      isConfigured: false,
      capabilities: { streaming: true, vision: true, tools: true, maxTokens: 8192 },
    },
  ];

  static getProvider(name: ProviderName): AIProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new AIProviderError(`Unsupported AI Provider: ${name}`, 'INVALID_MODEL', name, 400, false);
    }
    return provider;
  }

  static resolveProviderForModel(modelId: string): { provider: AIProvider; model: ModelMetadata } {
    let modelMeta = this.models.find((m) => m.id === modelId);
    if (!modelMeta) {
      modelMeta = this.models[0];
    }
    const provider = this.getProvider(modelMeta.provider);
    return { provider, model: modelMeta };
  }

  static getAvailableModels(): ModelMetadata[] {
    return this.models
      .map((m) => {
        const provider = this.providers.get(m.provider);
        return {
          ...m,
          isConfigured: provider ? provider.isConfigured() : false,
        };
      })
      .filter((m) => m.isConfigured);
  }
}
