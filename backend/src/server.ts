import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { checkDatabaseConnection } from './db/prisma.js';

const PORT = env.PORT || 5000;

async function startServer() {
  await checkDatabaseConnection();

  app.listen(PORT, () => {
    logger.info(`🚀 SurajAI Backend API running on port ${PORT} in ${env.NODE_ENV} mode.`);
    logger.info(`📡 Health Endpoint: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
