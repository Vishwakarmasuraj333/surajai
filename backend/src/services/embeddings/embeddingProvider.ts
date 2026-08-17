import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export interface EmbeddingProvider {
  embedText(text: string): Promise<number[]>;
  embedDocuments(texts: string[]): Promise<number[][]>;
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (env.AI_API_KEY && env.AI_API_KEY.length > 5) {
      this.genAI = new GoogleGenerativeAI(env.AI_API_KEY);
    }
  }

  /**
   * Deterministic fallback vector generator for testing when API key is unconfigured
   */
  private fallbackVector(text: string, dim = 1536): number[] {
    const vec = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const idx = (charCode * (i + 1)) % dim;
      vec[idx] += (charCode % 10) / 10;
    }
    // Normalize vector
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vec.map((v) => v / norm);
  }

  async embedText(text: string): Promise<number[]> {
    try {
      if (this.genAI) {
        const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(text);
        if (result.embedding?.values) {
          return result.embedding.values;
        }
      }
    } catch (err: any) {
      logger.warn('[GeminiEmbeddingProvider] API embed failed, using fallback vector generator:', err.message);
    }
    return this.fallbackVector(text);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const vec = await this.embedText(text);
      results.push(vec);
    }
    return results;
  }
}

export const embeddingProvider = new GeminiEmbeddingProvider();
