import { z } from 'zod';

export interface ToolContext {
  userId: string;
  conversationId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  execute(args: any, context: ToolContext): Promise<any>;
}

export interface ToolCallResult {
  toolName: string;
  arguments: any;
  result: any;
  success: boolean;
  error?: string;
}
