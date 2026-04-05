import type { ConnectionOptions } from 'bullmq';
import { getRedisConfig } from '../redis/redis.config';

export function getBullMQConnection(): ConnectionOptions {
  const config = getRedisConfig();
  return {
    host: config.host,
    port: config.port,
    password: config.password,
    enableOfflineQueue: false,
    maxRetriesPerRequest: null,
  };
}
