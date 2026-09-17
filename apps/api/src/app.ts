import express, { Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './utils/logger';
import { globalRateLimiter } from './middleware/rateLimit.middleware';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';
import { healthHandler } from './routes/health.routes';
import authRoutes from './modules/auth/auth.routes';
import projectRoutes from './modules/projects/project.routes';
import taskRoutes from './modules/tasks/task.routes';
import githubRoutes from './modules/github/github.routes';
import aiRoutes from './modules/ai/ai.routes';
import deploymentRoutes from './modules/deployments/deployment.routes';
import monitoringRoutes from './modules/monitoring/monitoring.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import chatRoutes from './modules/chat/chat.routes';
import sprintRoutes from './modules/sprints/sprint.routes';
import teamRoutes from './modules/projects/project.team.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import webhookRoutes from './modules/github/github.webhook.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(
    express.json({
      limit: '10mb',
      verify: (req, _res, buf) => {
        (req as Request & { rawBody?: string }).rawBody = buf.toString('utf8');
      },
    }),
  );
  app.use(pinoHttp({ logger }));
  app.use(globalRateLimiter);

  app.get('/api/health', healthHandler);
  app.use('/api/webhooks/github', webhookRoutes);

  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/projects/:projectId/tasks', taskRoutes);
  app.use('/api/projects/:projectId/github', githubRoutes);
  app.use('/api/projects/:projectId/ai', aiRoutes);
  app.use('/api/projects/:projectId/deployments', deploymentRoutes);
  app.use('/api/projects/:projectId/monitoring', monitoringRoutes);
  app.use('/api/projects/:projectId/chat', chatRoutes);
  app.use('/api/projects/:projectId/sprints', sprintRoutes);
  app.use('/api/projects/:projectId', teamRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
