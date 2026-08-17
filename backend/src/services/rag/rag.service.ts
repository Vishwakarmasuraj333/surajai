import { prisma } from '../../db/prisma.js';
import { embeddingProvider } from '../embeddings/embeddingProvider.js';
import { logger } from '../../utils/logger.js';

export interface RAGSearchResult {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  similarity: number;
}

export class RAGService {
  /**
   * Vector Cosine Similarity score calculation
   */
  private static cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  /**
   * Search knowledge base for top-K chunks matching user query
   */
  static async searchContext(userId: string, query: string, topK = 4): Promise<RAGSearchResult[]> {
    try {
      if (!query || query.trim().length === 0) return [];

      // Query embedding
      const queryVector = await embeddingProvider.embedText(query);

      // Fetch user READY document chunks
      const chunks = await prisma.documentChunk.findMany({
        where: {
          document: {
            userId,
            status: 'READY',
          },
        },
        include: {
          document: {
            select: { id: true, name: true },
          },
        },
        take: 300,
      });

      if (chunks.length === 0) return [];

      const scored: RAGSearchResult[] = [];

      for (const chunk of chunks) {
        if (!chunk.embedding) continue;
        const vector = chunk.embedding as unknown as number[];
        const similarity = this.cosineSimilarity(queryVector, vector);

        // Filter out low relevance scores
        if (similarity > 0.1) {
          scored.push({
            chunkId: chunk.id,
            documentId: chunk.document.id,
            documentName: chunk.document.name,
            content: chunk.content,
            similarity,
          });
        }
      }

      scored.sort((a, b) => b.similarity - a.similarity);
      return scored.slice(0, topK);
    } catch (err: any) {
      logger.warn('[RAGService] RAG retrieval failed:', err.message);
      return [];
    }
  }
}
