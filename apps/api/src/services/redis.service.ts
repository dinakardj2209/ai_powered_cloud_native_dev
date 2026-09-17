import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let redisAvailable = false;

export const cacheMetrics = {
  hits: 0,
  misses: 0,
  lastUncachedMs: 0,
  lastCachedMs: 0,
};

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 4) return null;
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on('error', (err) => {
      redisAvailable = false;
      logger.warn({ err: err.message }, 'Redis connection error');
    });

    redisClient.on('connect', () => {
      redisAvailable = true;
      logger.info('Redis connected successfully');
    });
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  try {
    const client = getRedisClient();
    if (client.status === 'wait') {
      await client.connect();
    }
    redisAvailable = client.status === 'ready' || client.status === 'connect';
  } catch (err) {
    redisAvailable = false;
    logger.warn({ err }, 'Redis unavailable — continuing without cache');
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      // ignore
    }
    redisClient = null;
    redisAvailable = false;
  }
}

export function isRedisConnected(): boolean {
  return redisAvailable && redisClient?.status === 'ready';
}

async function safeRedis<T>(fn: (client: Redis) => Promise<T>, fallback: T): Promise<T> {
  try {
    if (!isRedisConnected()) return fallback;
    return await fn(getRedisClient());
  } catch {
    return fallback;
  }
}

export async function storeRefreshToken(
  userId: string,
  token: string,
  ttlSeconds: number,
): Promise<void> {
  await safeRedis((client) => client.setex(`refresh:${userId}:${token}`, ttlSeconds, '1'), 'ok');
}

export async function isRefreshTokenValid(userId: string, token: string): Promise<boolean> {
  if (!isRedisConnected()) return true;
  const result = await safeRedis((client) => client.get(`refresh:${userId}:${token}`), '1');
  return result === '1';
}

export async function revokeRefreshToken(userId: string, token: string): Promise<void> {
  await safeRedis((client) => client.del(`refresh:${userId}:${token}`), 0);
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await safeRedis(async (client) => {
    const keys = await client.keys(`refresh:${userId}:*`);
    if (keys.length > 0) await client.del(...keys);
    return 1;
  }, 0);
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const started = Date.now();
  const data = await safeRedis((client) => client.get(key), null);
  if (!data) {
    cacheMetrics.misses += 1;
    return null;
  }
  cacheMetrics.hits += 1;
  cacheMetrics.lastCachedMs = Date.now() - started;
  return JSON.parse(data) as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await safeRedis((client) => client.setex(key, ttlSeconds, JSON.stringify(value)), 'ok');
}

export async function cacheDelete(key: string): Promise<void> {
  await safeRedis((client) => client.del(key), 0);
}

export function recordUncachedLatency(ms: number) {
  cacheMetrics.lastUncachedMs = ms;
}

export function getCacheStats() {
  const total = cacheMetrics.hits + cacheMetrics.misses;
  return {
    ...cacheMetrics,
    hitRate: total === 0 ? 0 : Number((cacheMetrics.hits / total).toFixed(2)),
  };
}
