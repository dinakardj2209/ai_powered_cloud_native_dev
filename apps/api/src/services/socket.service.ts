import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { JwtPayload } from '../middleware/auth.middleware';

let io: Server | null = null;

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: env.corsOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next();
      return;
    }
    try {
      const decoded = jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
      socket.data.user = decoded;
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket) => {
    logger.info({ id: socket.id }, 'Socket connected');

    socket.on('join:project', (projectId: string) => {
      if (!projectId) return;
      socket.join(`project:${projectId}`);
    });

    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {
      logger.info({ id: socket.id }, 'Socket disconnected');
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitToProject(projectId: string, event: string, payload: unknown) {
  io?.to(`project:${projectId}`).emit(event, payload);
}

export function emitToAll(event: string, payload: unknown) {
  io?.emit(event, payload);
}
