export type ProviderName = 'gemini' | 'openai' | 'anthropic';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface ModelMetadata {
  id: string;
  name: string;
  provider: ProviderName;
  description: string;
  isConfigured: boolean;
  capabilities: {
    streaming: boolean;
    vision: boolean;
    tools: boolean;
    maxTokens: number;
  };
}

export interface StreamChunkEvent {
  type: 'message_start' | 'text_delta' | 'message_complete' | 'error';
  content?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export type OnStreamChunk = (chunk: StreamChunkEvent) => void;

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}
