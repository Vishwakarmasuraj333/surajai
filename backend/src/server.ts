import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { checkDatabaseConnection } from './db/prisma.js';

const PORT = env.PORT || 5000;

async function startServer() {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 SurajAI Backend API running on port ${PORT} on 0.0.0.0 in ${env.NODE_ENV} mode.`);
    logger.info(`📡 Health Endpoint: http://0.0.0.0:${PORT}/api/health`);
  });

  checkDatabaseConnection().catch((err) => {
    logger.warn('Database connection check notice:', err);
  });
}

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
