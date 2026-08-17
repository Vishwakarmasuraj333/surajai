import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../db/prisma.js';
import { ProviderRegistry } from '../services/ai/providerRegistry.js';
import { env } from '../config/env.js';

export const getHealth = async (_req: Request, res: Response) => {
  const dbConnected = await checkDatabaseConnection();
  const availableModels = ProviderRegistry.getAvailableModels();
  const configuredModels = availableModels.filter((m) => m.isConfigured).map((m) => m.name);

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: '1.0.0',
    services: {
      database: dbConnected ? 'connected' : 'disconnected',
      aiProviders: configuredModels.length > 0 ? configuredModels : ['No API keys configured'],
    },
  };

  res.status(200).json({
    success: true,
    data: healthData,
  });
};
