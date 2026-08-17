// safety.service.ts — Unified SurajAI Safety Entry Point

import { TextSafetyService } from './textSafety.js';
import { ImageSafetyService } from './imageSafety.js';
import { SafetyResult, ImageSafetyResult } from './safety.types.js';

export class SafetyService {
  /**
   * Validate a chat message before processing.
   * Returns safe: true for normal requests.
   */
  static validateChatRequest(text: string): SafetyResult {
    return TextSafetyService.check(text);
  }

  /**
   * Validate AI generated text response.
   */
  static validateChatResponse(text: string): SafetyResult {
    return TextSafetyService.checkOutput(text);
  }

  /**
   * Validate and normalize an image generation prompt.
   * Returns safe: false if the prompt is explicitly blocked.
   * Returns safe: true with a normalizedPrompt that is safe to send to the provider.
   */
  static validateImageRequest(prompt: string): ImageSafetyResult {
    return ImageSafetyService.checkPrompt(prompt);
  }

  /**
   * Validate generated image output before storing or exposing.
   */
  static validateImageResponse(meta?: { storageKey?: string; mimeType?: string }): { safe: boolean; reason?: string } {
    return ImageSafetyService.checkImageOutput(meta);
  }
}

