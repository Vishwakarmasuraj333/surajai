// Deprecated: Real AI Provider is enforced for all chat completions.
export class LocalFallbackEngine {
  static generateResponse(): string {
    throw new Error('Real AI provider must be used.');
  }
}
