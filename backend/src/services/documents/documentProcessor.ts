import { prisma } from '../../db/prisma.js';
import { embeddingProvider } from '../embeddings/embeddingProvider.js';
import { logger } from '../../utils/logger.js';
import { DocumentStatus } from '@prisma/client';

export class DocumentProcessor {
  /**
   * Split raw text into overlapping chunks
   */
  static chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];

    const chunks: string[] = [];
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      const chunkStr = words.slice(start, end).join(' ');
      if (chunkStr.trim().length > 0) {
        chunks.push(chunkStr);
      }
      if (end >= words.length) break;
      start += chunkSize - overlap;
    }

    return chunks;
  }

  /**
   * Extract clean text content from file buffer based on MIME type
   */
  static extractTextFromBuffer(buffer: Buffer, mimeType: string, filename: string): string {
    const rawStr = buffer.toString('utf-8');

    if (mimeType === 'application/json' || filename.endsWith('.json')) {
      try {
        const obj = JSON.parse(rawStr);
        return JSON.stringify(obj, null, 2);
      } catch {
        return rawStr;
      }
    }

    // Default clean text stripping null bytes
    return rawStr.replace(/\0/g, '').trim();
  }

  /**
   * Process uploaded document asynchronously: Extract -> Chunk -> Embed -> Save -> READY
   */
  static async processDocument(documentId: string, fileBuffer: Buffer): Promise<void> {
    try {
      logger.info(`[DocumentProcessor] Starting processing for document ${documentId}`);

      await prisma.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.PROCESSING },
      });

      const doc = await prisma.document.findUnique({ where: { id: documentId } });
      if (!doc) throw new Error('Document not found');

      const extractedText = this.extractTextFromBuffer(fileBuffer, doc.mimeType, doc.name);
      if (!extractedText || extractedText.length === 0) {
        throw new Error('Could not extract readable text content from file');
      }

      const chunks = this.chunkText(extractedText, 500, 50);
      let totalTokens = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        const estimatedTokens = Math.ceil(chunkText.length / 4);
        totalTokens += estimatedTokens;

        const embeddingVector = await embeddingProvider.embedText(chunkText);

        await prisma.documentChunk.create({
          data: {
            documentId: doc.id,
            chunkIndex: i,
            content: chunkText,
            tokenCount: estimatedTokens,
            embedding: embeddingVector as any,
          },
        });
      }

      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.READY,
          chunkCount: chunks.length,
          tokenCount: totalTokens,
        },
      });

      logger.info(`[DocumentProcessor] Successfully processed document ${documentId} (${chunks.length} chunks)`);
    } catch (err: any) {
      logger.error(`[DocumentProcessor] Failed to process document ${documentId}:`, err);
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.FAILED,
          errorMessage: err.message || 'Processing failed',
        },
      }).catch(() => {});
    }
  }
}
