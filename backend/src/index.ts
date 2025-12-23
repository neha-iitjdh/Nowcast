import { createServer } from 'http';
import app from './app.js';
import { config } from './config/index.js';
import prisma from './config/database.js';
import { getRedis, closeRedis } from './config/redis.js';
import { initializeSocket } from './websocket/socketHandler.js';
import { initializeNotificationSubscriber } from './services/notificationService.js';

const httpServer = createServer(app);

// Initialize WebSocket
initializeSocket(httpServer);

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Connected to PostgreSQL database');

    // Test Redis connection
    try {
      const redis = getRedis();
      await redis.ping();
      console.log('Connected to Redis');

      // Initialize notification subscriber
      await initializeNotificationSubscriber();
    } catch (redisError) {
      console.warn('Redis not available, running without cache:', redisError);
    }

    // Start server
    httpServer.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
      console.log(`Environment: ${config.env}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('\nShutting down gracefully...');

  httpServer.close(() => {
    console.log('HTTP server closed');
  });

  await prisma.$disconnect();
  console.log('Database connection closed');

  try {
    await closeRedis();
    console.log('Redis connection closed');
  } catch {
    // Ignore Redis close errors
  }

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

main();
