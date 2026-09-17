import { Deployment } from './deployment.model';
import { Project } from '../projects/project.model';
import { AppError } from '../../utils/AppError';
import { emitToProject } from '../../services/socket.service';
import { Notification } from '../notifications/notification.model';

function toDto(d: {
  id?: string;
  _id: { toString(): string };
  projectId: { toString(): string };
  number: number;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'CANCELLED';
  commitSha: string;
  commitMessage: string;
  branch: string;
  environment: 'production' | 'staging';
  triggeredBy: string;
  steps: Array<{ name: string; status: string; durationMs: number }>;
  startedAt: Date;
  finishedAt?: Date;
  url?: string;
}) {
  return {
    id: d.id ?? d._id.toString(),
    projectId: d.projectId.toString(),
    number: d.number,
    status: d.status,
    commitSha: d.commitSha,
    commitMessage: d.commitMessage,
    branch: d.branch,
    environment: d.environment,
    triggeredBy: d.triggeredBy,
    steps: d.steps,
    startedAt: d.startedAt.toISOString(),
    finishedAt: d.finishedAt?.toISOString(),
    url: d.url,
  };
}

async function assertAccess(projectId: string, userId: string) {
  const project = await Project.findById(projectId);
  if (!project) throw AppError.notFound('Project not found');
  const isMember =
    project.ownerId.toString() === userId ||
    project.members.some((m) => m.userId.toString() === userId);
  if (!isMember) throw AppError.forbidden('You do not have access to this project');
  return project;
}

export async function listDeployments(projectId: string, userId: string) {
  await assertAccess(projectId, userId);
  const items = await Deployment.find({ projectId }).sort({ number: -1 }).limit(20);
  return items.map(toDto);
}

export async function getDeployment(projectId: string, userId: string, number?: number) {
  await assertAccess(projectId, userId);
  const item = number
    ? await Deployment.findOne({ projectId, number })
    : await Deployment.findOne({ projectId }).sort({ number: -1 });
  if (!item) throw AppError.notFound('Deployment not found');
  return toDto(item);
}

export async function triggerDeployment(projectId: string, userId: string, userName: string) {
  await assertAccess(projectId, userId);
  const last = await Deployment.findOne({ projectId }).sort({ number: -1 });
  const number = (last?.number ?? 141) + 1;

  const steps = [
    { name: 'Dependencies installed', status: 'success' as const, durationMs: 12400 },
    { name: 'Unit tests', status: 'success' as const, durationMs: 8600 },
    { name: 'ESLint', status: 'success' as const, durationMs: 3100 },
    { name: 'Build', status: 'success' as const, durationMs: 15200 },
    { name: 'Docker build', status: 'success' as const, durationMs: 22100 },
    { name: 'Deployment', status: 'success' as const, durationMs: 18400 },
  ];

  const deployment = await Deployment.create({
    projectId,
    number,
    status: 'SUCCESS',
    commitSha: 'a1b2c3d',
    commitMessage: 'Implemented JWT authentication',
    branch: 'feature/authentication',
    environment: 'production',
    triggeredBy: userName,
    steps,
    startedAt: new Date(Date.now() - 80000),
    finishedAt: new Date(),
    url: 'https://app.devflow.dev',
  });

  const dto = toDto(deployment);
  emitToProject(projectId, 'deployment', dto);
  await Notification.create({
    userId,
    type: 'deploy',
    title: `BUILD #${number} succeeded`,
    body: 'Tests, lint, Docker build, and AWS deploy completed.',
    projectId,
  });
  return dto;
}
