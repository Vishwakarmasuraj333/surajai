import { storageProvider } from '../storage/storageProvider.js';
import crypto from 'crypto';
import OpenAI from 'openai';
import { env } from '../../config/env.js';

export interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  style?: string;
  model?: string;
  provider?: string;
  userId?: string;
}

export interface GeneratedImageResult {
  storageKey: string;
  mimeType: string;
  width: number;
  height: number;
  fileUrl: string;
  provider: string;
  model: string;
  prompt: string;
  revisedPrompt?: string;
}

export interface ImageGenerationProvider {
  name: string;
  isConfigured(): boolean;
  generate(options: ImageGenerationOptions): Promise<GeneratedImageResult>;
}

// ── Pollinations Free AI Image Provider ───────────────────────────────────────
export class PollinationsImageProvider implements ImageGenerationProvider {
  name = 'pollinations';

  isConfigured(): boolean {
    return true;
  }

  async generate(options: ImageGenerationOptions): Promise<GeneratedImageResult> {
    const { prompt, width: reqWidth, height: reqHeight, aspectRatio, model: reqModel } = options;

    let width = reqWidth || 1024;
    let height = reqHeight || 1024;

    if (aspectRatio === '16:9') {
      width = 1280;
      height = 720;
    } else if (aspectRatio === '9:16') {
      width = 720;
      height = 1280;
    }

    const selectedModel = reqModel || 'flux';
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(prompt);

    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${selectedModel}&nologo=true`;

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Pollinations Image generation failed with HTTP status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileId = crypto.randomUUID();
    const filename = `gen_${fileId}.png`;
    const fileUrl = await storageProvider.uploadFile(buffer, filename);

    return {
      storageKey: fileUrl,
      mimeType: 'image/png',
      width,
      height,
      fileUrl,
      provider: 'pollinations',
      model: selectedModel,
      prompt,
      revisedPrompt: prompt,
    };
  }
}

// ── OpenAI DALL-E 3 Image Provider ───────────────────────────────────────────
export class OpenAIImageProvider implements ImageGenerationProvider {
  name = 'openai';

  isConfigured(): boolean {
    return Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim() !== '');
  }

  async generate(options: ImageGenerationOptions): Promise<GeneratedImageResult> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI Image generation is not configured. Add OPENAI_API_KEY to server environment.');
    }

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY! });
    const { prompt, aspectRatio } = options;

    let size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024';
    let width = 1024;
    let height = 1024;

    if (aspectRatio === '16:9') {
      size = '1792x1024';
      width = 1792;
      height = 1024;
    } else if (aspectRatio === '9:16') {
      size = '1024x1792';
      width = 1024;
      height = 1792;
    }

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size,
      response_format: 'b64_json',
    });

    const imageData = response.data?.[0];
    const b64Data = imageData?.b64_json;
    const revisedPrompt = imageData?.revised_prompt || prompt;

    if (!b64Data) {
      throw new Error('OpenAI Image generation returned empty image payload.');
    }

    const buffer = Buffer.from(b64Data, 'base64');
    const fileId = crypto.randomUUID();
    const filename = `openai_gen_${fileId}.png`;
    const fileUrl = await storageProvider.uploadFile(buffer, filename);

    return {
      storageKey: fileUrl,
      mimeType: 'image/png',
      width,
      height,
      fileUrl,
      provider: 'openai',
      model: 'dall-e-3',
      prompt,
      revisedPrompt,
    };
  }
}

// ── Multi-Provider Image Generation Service ───────────────────────────────
export class ImageGenerationService {
  private static providers: Map<string, ImageGenerationProvider> = new Map([
    ['pollinations', new PollinationsImageProvider()],
    ['openai', new OpenAIImageProvider()],
    ['dall-e-3', new OpenAIImageProvider()],
  ]);

  static async generate(options: ImageGenerationOptions): Promise<GeneratedImageResult> {
    const requestedProvider = options.provider?.toLowerCase() || 'pollinations';
    const provider = this.providers.get(requestedProvider) || this.providers.get('pollinations')!;

    if (!provider.isConfigured()) {
      // Fallback to open provider if requested one is unconfigured
      const fallback = this.providers.get('pollinations')!;
      return fallback.generate(options);
    }

    return provider.generate(options);
  }
}

export const defaultImageProvider = new PollinationsImageProvider();
