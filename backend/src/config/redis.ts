import Redis from 'ioredis';
import { config } from './index.js';

let redis: Redis | null = null;
let publisher: Redis | null = null;
let subscriber: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('Connected to Redis');
    });
  }
  return redis;
}

export function getPublisher(): Redis {
  if (!publisher) {
    publisher = new Redis(config.redis.url);
    publisher.on('error', (err) => {
      console.error('Redis publisher error:', err);
    });
  }
  return publisher;
}

export function getSubscriber(): Redis {
  if (!subscriber) {
    subscriber = new Redis(config.redis.url);
    subscriber.on('error', (err) => {
      console.error('Redis subscriber error:', err);
    });
  }
  return subscriber;
}

export async function closeRedis(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  if (redis) {
    closePromises.push(redis.quit().then(() => { redis = null; }));
  }
  if (publisher) {
    closePromises.push(publisher.quit().then(() => { publisher = null; }));
  }
  if (subscriber) {
    closePromises.push(subscriber.quit().then(() => { subscriber = null; }));
  }

  await Promise.all(closePromises);
}

export default { getRedis, getPublisher, getSubscriber, closeRedis };
