import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './services/redis.service';
import { initSocket } from './services/socket.service';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    await connectDatabase();
    await connectRedis();

    const app = createApp();
    const server = http.createServer(app);
    initSocket(server);

    server.listen(env.port, () => {
      logger.info(`DevFlow API running on http://localhost:${env.port}`);
      logger.info(`Environment: ${env.nodeEnv}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await disconnectRedis();
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
