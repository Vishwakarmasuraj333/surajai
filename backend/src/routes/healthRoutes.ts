import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  const geminiConfigured = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 5);
  const openaiConfigured = Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.length > 5);

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      api: 'healthy',
      database: dbStatus,
      gemini: geminiConfigured ? 'configured' : 'not_configured',
      openai: openaiConfigured ? 'configured' : 'not_configured',
    },
  });
});

router.get('/ai/providers/status', async (_req: Request, res: Response) => {
  const geminiConfigured = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.length > 5);
  const openaiConfigured = Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.length > 5);

  res.status(200).json({
    success: true,
    data: {
      gemini: {
        configured: geminiConfigured,
        available: geminiConfigured,
      },
      openai: {
        configured: openaiConfigured,
        available: openaiConfigured,
      },
    },
  });
});

export default router;
