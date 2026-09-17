import { Types } from 'mongoose';
import {
  CreateProjectInput,
  UpdateProjectInput,
  UserRole,
  PaginatedResponse,
  Project as ProjectDTO,
} from '@devflow/shared';
import { AppError } from '../../utils/AppError';
import { Project } from './project.model';
import { toProjectDTO } from './project.mapper';
import { cacheGet, cacheSet, cacheDelete } from '../../services/redis.service';

const PROJECT_CACHE_TTL = 300; // 5 minutes

function isProjectMember(
  project: { ownerId: Types.ObjectId; members: { userId: Types.ObjectId }[] },
  userId: string,
): boolean {
  if (project.ownerId.toString() === userId) return true;
  return project.members.some((m) => m.userId.toString() === userId);
}

export async function createProject(
  userId: string,
  input: CreateProjectInput,
): Promise<ProjectDTO> {
  const project = await Project.create({
    ...input,
    ownerId: userId,
    members: [{ userId, role: UserRole.ADMIN, joinedAt: new Date() }],
  });

  await cacheDelete(`projects:${userId}:1:20`);
  return toProjectDTO(project);
}

export async function getProjects(
  userId: string,
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<ProjectDTO>> {
  const cacheKey = `projects:${userId}:${page}:${limit}`;
  const cached = await cacheGet<PaginatedResponse<ProjectDTO>>(cacheKey);
  if (cached) return cached;

  const filter = {
    $or: [{ ownerId: userId }, { 'members.userId': userId }],
    status: 'ACTIVE',
  };

  const skip = (page - 1) * limit;
  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Project.countDocuments(filter),
  ]);

  const result: PaginatedResponse<ProjectDTO> = {
    items: projects.map(toProjectDTO),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  await cacheSet(cacheKey, result, PROJECT_CACHE_TTL);
  return result;
}

export async function getProjectById(
  projectId: string,
  userId: string,
): Promise<ProjectDTO> {
  const cacheKey = `project:${projectId}`;
  const cached = await cacheGet<ProjectDTO>(cacheKey);

  const project = cached
    ? await Project.findById(projectId)
    : await Project.findById(projectId);

  if (!project) {
    throw AppError.notFound('Project not found');
  }

  if (!isProjectMember(project, userId)) {
    throw AppError.forbidden('You do not have access to this project');
  }

  const dto = toProjectDTO(project);

  if (!cached) {
    await cacheSet(cacheKey, dto, PROJECT_CACHE_TTL);
  }

  return dto;
}

export async function updateProject(
  projectId: string,
  userId: string,
  input: UpdateProjectInput,
): Promise<ProjectDTO> {
  const project = await Project.findById(projectId);
  if (!project) {
    throw AppError.notFound('Project not found');
  }

  if (project.ownerId.toString() !== userId) {
    throw AppError.forbidden('Only the project owner can update project details');
  }

  Object.assign(project, input);
  await project.save();

  await cacheDelete(`project:${projectId}`);

  return toProjectDTO(project);
}

export async function deleteProject(
  projectId: string,
  userId: string,
): Promise<void> {
  const project = await Project.findById(projectId);
  if (!project) {
    throw AppError.notFound('Project not found');
  }

  if (project.ownerId.toString() !== userId) {
    throw AppError.forbidden('Only the project owner can delete the project');
  }

  project.status = 'ARCHIVED' as typeof project.status;
  await project.save();

  await cacheDelete(`project:${projectId}`);
}

export async function getProjectStats(projectId: string, userId: string) {
  const project = await getProjectById(projectId, userId);
  const { Task } = await import('../tasks/task.model');

  const taskCounts = await Task.aggregate([
    { $match: { projectId: new Types.ObjectId(projectId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const stats: Record<string, number> = {
    TODO: 0,
    IN_PROGRESS: 0,
    REVIEW: 0,
    DONE: 0,
  };

  for (const item of taskCounts) {
    stats[item._id] = item.count;
  }

  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  const { productivityInsights } = await import('../../services/ai.service');

  return {
    project,
    taskStats: stats,
    totalTasks: total,
    completionRate: total > 0 ? Math.round((stats.DONE / total) * 100) : 0,
    insights: productivityInsights(stats),
  };
}
