import { AIMessage } from '../ai/types.js';
import { MemoryService } from '../memory/memory.service.js';
import { RAGService, RAGSearchResult } from '../rag/rag.service.js';
import { ToolCallResult } from '../tools/toolTypes.js';
import { buildSystemPrompt } from '../ai/systemPrompt.js';

export interface BuildContextOptions {
  userId: string;
  userName?: string;
  conversationId?: string;
  userPrompt: string;
  recentMessages: AIMessage[];
  conversationSummary?: string | null;
  toolResults?: ToolCallResult[];
}

export interface ContextBuildOutput {
  messages: AIMessage[];
  citations: Array<{ documentId: string; documentName: string; content: string }>;
  memoriesUsed: string[];
}

export class ContextEngine {
  /**
   * Build complete context prompt with system rules, AI personality engine, user identity, memories, RAG chunks, tools, and history
   */
  static async buildContext(options: BuildContextOptions): Promise<ContextBuildOutput> {
    const { userId, userName, userPrompt, recentMessages, conversationSummary, toolResults } = options;

    const memoriesUsed: string[] = [];
    const citations: Array<{ documentId: string; documentName: string; content: string }> = [];

    // 1. System Core Instructions using buildSystemPrompt
    let systemPrompt = buildSystemPrompt({ userName });

    // 2. Fetch Relevant User Memories
    const memories = await MemoryService.retrieveRelevantMemories(userId, userPrompt, 4);
    if (memories.length > 0) {
      systemPrompt += `\n\n<USER_LONG_TERM_MEMORIES>\nThe user has shared the following persistent background facts & preferences:\n`;
      for (const m of memories) {
        systemPrompt += `- [${m.type}] ${m.content}\n`;
        memoriesUsed.push(m.content);
      }
      systemPrompt += `</USER_LONG_TERM_MEMORIES>`;
    }

    // 3. Fetch Relevant RAG Document Chunks
    const ragChunks: RAGSearchResult[] = await RAGService.searchContext(userId, userPrompt, 4);
    if (ragChunks.length > 0) {
      systemPrompt += `\n\n<RETRIEVED_KNOWLEDGE_BASE_CONTEXT>\nThe following document excerpts were retrieved from the user's Knowledge Base:\n`;
      for (const chunk of ragChunks) {
        systemPrompt += `--- Source Document: "${chunk.documentName}" (ID: ${chunk.documentId}) ---\n${chunk.content}\n`;
        citations.push({
          documentId: chunk.documentId,
          documentName: chunk.documentName,
          content: chunk.content,
        });
      }
      systemPrompt += `\nRule for Citations: If you use facts from these documents, cite them clearly using the document name.\n</RETRIEVED_KNOWLEDGE_BASE_CONTEXT>`;
    }

    // 4. Executed Tool Results
    if (toolResults && toolResults.length > 0) {
      systemPrompt += `\n\n<EXECUTED_TOOL_RESULTS>\nThe following live tools were executed for this request:\n`;
      for (const tr of toolResults) {
        systemPrompt += `Tool: ${tr.toolName}\nArguments: ${JSON.stringify(tr.arguments)}\nResult: ${JSON.stringify(tr.result)}\n\n`;
      }
      systemPrompt += `</EXECUTED_TOOL_RESULTS>`;
    }

    // 5. Conversation Summary if long
    if (conversationSummary && conversationSummary.length > 0) {
      systemPrompt += `\n\n<CONVERSATION_SUMMARY_BACKGROUND>\nPrevious Conversation Summary:\n${conversationSummary}\n</CONVERSATION_SUMMARY_BACKGROUND>`;
    }

    // Assemble final messages payload
    const finalMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages,
      { role: 'user', content: userPrompt },
    ];

    return {
      messages: finalMessages,
      citations,
      memoriesUsed,
    };
  }
}
