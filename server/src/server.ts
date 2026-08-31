import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  await connectDatabase();
  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`Server listening on port ${env.port}`);
  });
}

main().catch((error) => {
  logger.error('Failed to start server', { message: (error as Error).message });
  process.exit(1);
});
