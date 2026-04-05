import Redis from 'ioredis';
import { getRedisConfig } from './redis.config';

let redisInstance: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisInstance) {
    const config = getRedisConfig();
    redisInstance = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db ?? 0,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: null, // Required by BullMQ
    });
  }
  return redisInstance;
}
