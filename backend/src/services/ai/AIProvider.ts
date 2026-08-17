import { AIMessage, ChatCompletionOptions, OnStreamChunk, ProviderName } from './types.js';

export interface AIProvider {
  name: ProviderName;
  isConfigured(): boolean;
  chat(messages: AIMessage[], options?: ChatCompletionOptions): Promise<string>;
  streamChat(messages: AIMessage[], onChunk: OnStreamChunk, options?: ChatCompletionOptions): Promise<string>;
}
