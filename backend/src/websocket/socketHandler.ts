import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthenticatedUser } from '../types/index.js';

let io: SocketServer | null = null;

// Map of userId to socket IDs
const userSockets = new Map<string, Set<string>>();

export function initializeSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : ['http://localhost:5173', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthenticatedUser;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as AuthenticatedUser;
    console.log(`User connected: ${user.username} (${socket.id})`);

    // Track user socket
    if (!userSockets.has(user.id)) {
      userSockets.set(user.id, new Set());
    }
    userSockets.get(user.id)!.add(socket.id);

    // Join user's personal room for notifications
    socket.join(`user:${user.id}`);

    // Handle joining/leaving post rooms (for real-time updates)
    socket.on('join:post', (postId: string) => {
      socket.join(`post:${postId}`);
    });

    socket.on('leave:post', (postId: string) => {
      socket.leave(`post:${postId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.username} (${socket.id})`);

      const sockets = userSockets.get(user.id);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(user.id);
        }
      }
    });
  });

  console.log('Socket.io initialized');
  return io;
}

export function getIO(): SocketServer {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToPost(postId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`post:${postId}`).emit(event, data);
  }
}

export function broadcastNotification(
  userId: string,
  notification: {
    type: string;
    message: string;
    postId?: string;
    actorId: string;
    actorName: string;
  }
): void {
  emitToUser(userId, 'notification', notification);
}

export function isUserOnline(userId: string): boolean {
  return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
}
