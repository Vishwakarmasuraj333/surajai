import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { ImageGenerationService, defaultImageProvider } from '../../services/image/imageGenerationProvider.js';
import { storageProvider } from '../../services/storage/storageProvider.js';
import { SafetyService } from '../../services/safety/safety.service.js';
import path from 'path';
import fs from 'fs';

const generateImageSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty').max(2000, 'Prompt is too long'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16']).optional().default('1:1'),
  model: z.string().optional().default('flux'),
  conversationId: z.string().optional(),
});

const editImagePromptSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty').max(2000, 'Prompt is too long'),
});

const formatImageUrl = (storageKey?: string | null): string => {
  if (!storageKey) return '';
  if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
    return storageKey;
  }
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  return `${backendUrl}${storageKey.startsWith('/') ? '' : '/'}${storageKey}`;
};

export const generateImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { prompt, aspectRatio, model, conversationId } = generateImageSchema.parse(req.body);

    if (conversationId) {
      const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!conv || conv.userId !== userId) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Conversation not found or access denied' },
        });
      }
    }

    // ── Safety Validation ─────────────────────────────────────────────────────
    const safetyResult = SafetyService.validateImageRequest(prompt);
    if (!safetyResult.safe) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'IMAGE_SAFETY_VIOLATION',
          message: safetyResult.reason ||
            "⚠️ I can help create a safe, non-explicit image instead.",
          category: safetyResult.category,
        },
      });
    }
    // Use the normalized (safe) prompt for actual generation
    const safePrompt = safetyResult.normalizedPrompt || prompt;
    // ─────────────────────────────────────────────────────────────────────────

    // Call real multi-provider image generation service with normalized safe prompt
    let genResult;
    try {
      genResult = await ImageGenerationService.generate({
        prompt: safePrompt,
        aspectRatio,
        model,
        provider: (req.body.provider as string) || 'openai',
        userId,
      });
    } catch (err: any) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'PROVIDER_UNAVAILABLE',
          message: err.message || '🖼️ Image generation is not configured or temporarily unavailable.',
        },
      });
    }

    // Post-generation Output Moderation Check
    const outputSafety = SafetyService.validateImageResponse({
      storageKey: genResult.storageKey,
      mimeType: genResult.mimeType,
    });

    if (!outputSafety.safe) {
      // Purge generated file if unsafe
      await storageProvider.deleteFile(genResult.storageKey).catch(() => {});
      return res.status(400).json({
        success: false,
        error: {
          code: 'IMAGE_OUTPUT_UNSAFE',
          message: "⚠️ The generated result could not be shown because it didn't meet SurajAI's safety requirements.",
        },
      });
    }

    // Save record to GeneratedImage database table
    const imageRecord = await (prisma as any).generatedImage.create({
      data: {
        userId,
        conversationId: conversationId || null,
        provider: genResult.provider,
        model: genResult.model,
        prompt: prompt,               // store original user prompt
        revisedPrompt: safePrompt,    // store normalized safe prompt
        storageKey: genResult.storageKey,
        mimeType: genResult.mimeType,
        width: genResult.width,
        height: genResult.height,
        aspectRatio,
        status: 'completed',
      },
    });

    res.status(201).json({
      success: true,
      data: {
        image: {
          ...imageRecord,
          url: formatImageUrl(genResult.fileUrl),
        },
      },
    });
  } catch (err: any) {
    next(err);
  }
};


export const getImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const filter = (req.query.filter as string) || 'all';

    let whereClause: any = { userId };
    if (filter === 'favorites') {
      whereClause.isFavorite = true;
    }

    const images = await (prisma as any).generatedImage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const formattedImages = images.map((img: any) => ({
      ...img,
      url: formatImageUrl(img.storageKey),
    }));

    res.status(200).json({
      success: true,
      data: { images: formattedImages },
    });
  } catch (err) {
    next(err);
  }
};

export const getImageById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const image = await (prisma as any).generatedImage.findFirst({
      where: { id, userId },
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Image not found or access denied' },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        image: {
          ...image,
          url: formatImageUrl(image.storageKey),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const downloadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const image = await (prisma as any).generatedImage.findFirst({
      where: { id, userId },
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Image not found or access denied' },
      });
    }

    const filePath = storageProvider.getFilePath(image.storageKey);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'Image file does not exist on disk' },
      });
    }

    res.setHeader('Content-Type', image.mimeType || 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="surajai_${image.id}.png"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
};

export const deleteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const image = await (prisma as any).generatedImage.findFirst({
      where: { id, userId },
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Image not found or access denied' },
      });
    }

    // Delete physical file from storage
    await storageProvider.deleteFile(image.storageKey).catch(() => {});

    // Delete DB record
    await (prisma as any).generatedImage.delete({ where: { id } });

    res.status(200).json({
      success: true,
      data: { message: 'Image deleted successfully' },
    });
  } catch (err) {
    next(err);
  }
};

export const bulkDeleteImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'ids array is required' },
      });
    }

    const images = await (prisma as any).generatedImage.findMany({
      where: { id: { in: ids }, userId },
    });

    for (const image of images) {
      await storageProvider.deleteFile(image.storageKey).catch(() => {});
    }

    await (prisma as any).generatedImage.deleteMany({
      where: { id: { in: ids }, userId },
    });

    res.status(200).json({
      success: true,
      data: { message: `${images.length} images deleted successfully` },
    });
  } catch (err) {
    next(err);
  }
};

export const regenerateImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const image = await (prisma as any).generatedImage.findFirst({
      where: { id, userId },
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Image not found or access denied' },
      });
    }

    // Generate fresh image using original prompt
    const genResult = await defaultImageProvider.generate({
      prompt: image.prompt,
      aspectRatio: image.aspectRatio,
      model: image.model,
      userId,
    });

    const newRecord = await (prisma as any).generatedImage.create({
      data: {
        userId,
        conversationId: image.conversationId,
        provider: genResult.provider,
        model: genResult.model,
        prompt: image.prompt,
        revisedPrompt: genResult.revisedPrompt,
        storageKey: genResult.storageKey,
        mimeType: genResult.mimeType,
        width: genResult.width,
        height: genResult.height,
        aspectRatio: image.aspectRatio,
        status: 'completed',
      },
    });

    res.status(201).json({
      success: true,
      data: {
        image: {
          ...newRecord,
          url: formatImageUrl(genResult.fileUrl),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const editImagePrompt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;
    const { prompt: newPrompt } = editImagePromptSchema.parse(req.body);

    const image = await (prisma as any).generatedImage.findFirst({
      where: { id, userId },
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Image not found or access denied' },
      });
    }

    // Generate fresh image with edited prompt
    const genResult = await defaultImageProvider.generate({
      prompt: newPrompt,
      aspectRatio: image.aspectRatio,
      model: image.model,
      userId,
    });

    const updated = await (prisma as any).generatedImage.update({
      where: { id },
      data: {
        prompt: newPrompt,
        revisedPrompt: genResult.revisedPrompt,
        storageKey: genResult.storageKey,
        width: genResult.width,
        height: genResult.height,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      data: {
        image: {
          ...updated,
          url: formatImageUrl(genResult.fileUrl),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
