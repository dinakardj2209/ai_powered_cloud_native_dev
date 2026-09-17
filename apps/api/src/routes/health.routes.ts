import { Request, Response } from 'express';
import { isDatabaseConnected } from '../config/database';
import { isRedisConnected } from '../services/redis.service';

const startTime = Date.now();

export function healthHandler(_req: Request, res: Response): void {
  const mongodb = isDatabaseConnected();
  const redis = isRedisConnected();
  const allHealthy = mongodb && redis;

  res.status(200).json({
    success: true,
    data: {
      status: allHealthy ? 'healthy' : mongodb ? 'degraded' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        api: true,
        mongodb,
        redis,
      },
      uptime: Math.floor((Date.now() - startTime) / 1000),
    },
  });
}
