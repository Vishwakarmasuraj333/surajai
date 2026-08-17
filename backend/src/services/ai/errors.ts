import { AppError } from '../../middlewares/errorHandler.js';

export type AIErrorCode =
  | 'PROVIDER_NOT_CONFIGURED'
  | 'INVALID_API_KEY'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'PROVIDER_UNAVAILABLE'
  | 'INVALID_MODEL'
  | 'CONTENT_BLOCKED'
  | 'UNKNOWN_PROVIDER_ERROR';

export class AIProviderError extends Error implements AppError {
  statusCode: number;
  code: AIErrorCode;
  provider: string;
  retryable: boolean;

  constructor(message: string, code: AIErrorCode = 'UNKNOWN_PROVIDER_ERROR', provider: string = 'unknown', statusCode = 500, retryable = false) {
    super(message);
    this.name = 'AIProviderError';
    this.code = code;
    this.provider = provider;
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}
