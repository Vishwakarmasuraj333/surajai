// safety.types.ts — Shared type definitions for SurajAI Safety Layer

export interface SafetyResult {
  safe: boolean;
  reason?: string;
  normalizedPrompt?: string;
  category?: 'sexual' | 'harmful' | 'jailbreak' | 'illegal' | 'ok';
}

export interface ImageSafetyResult extends SafetyResult {
  normalizedPrompt: string; // Always populated — either sanitized or the safe version
}

export interface OutputSafetyResult {
  safe: boolean;
  reason?: string;
  category?: 'sexual' | 'harmful' | 'illegal' | 'ok';
}

