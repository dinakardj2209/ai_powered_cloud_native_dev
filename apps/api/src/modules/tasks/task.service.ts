import { Types } from 'mongoose';
import {
  CreateTaskInput,
  UpdateTaskInput,
  Task as TaskDTO,
  PaginatedResponse,
  TaskStatus,
} from '@devflow/shared';
import { AppError } from '../../utils/AppError';
import { Task } from './task.model';
import { toTaskDTO } from './task.mapper';
import { Project } from '../projects/project.model';

async function verifyProjectAccess(projectId: string, userId: string) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw AppError.notFound('Project not found');
  }

  const isMember =
    project.ownerId.toString() === userId ||
    project.members.some((m) => m.userId.toString() === userId);

  if (!isMember) {
    throw AppError.forbidden('You do not have access to this project');
  }

  return project;
}

export async function createTask(
  projectId: string,
  userId: string,
  input: CreateTaskInput,
): Promise<TaskDTO> {
  await verifyProjectAccess(projectId, userId);

  const task = await Task.create({
    ...input,
    projectId,
    createdById: userId,
  });

  const { logActivity } = await import('../activity/activity.service');
  await logActivity({
    projectId,
    userId,
    userName: 'Developer',
    action: 'created a task',
    detail: task.title,
  });

  return toTaskDTO(task);
}

export async function getTasksByProject(
  projectId: string,
  userId: string,
  page = 1,
  limit = 50,
): Promise<PaginatedResponse<TaskDTO>> {
  await verifyProjectAccess(projectId, userId);

  const skip = (page - 1) * limit;
  const filter = { projectId: new Types.ObjectId(projectId) };

  const [tasks, total] = await Promise.all([
    Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Task.countDocuments(filter),
  ]);

  return {
    items: tasks.map(toTaskDTO),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTaskById(
  taskId: string,
  userId: string,
): Promise<TaskDTO> {
  const task = await Task.findById(taskId);
  if (!task) {
    throw AppError.notFound('Task not found');
  }

  await verifyProjectAccess(task.projectId.toString(), userId);
  return toTaskDTO(task);
}

export async function updateTask(
  taskId: string,
  userId: string,
  input: UpdateTaskInput,
): Promise<TaskDTO> {
  const task = await Task.findById(taskId);
  if (!task) {
    throw AppError.notFound('Task not found');
  }

  await verifyProjectAccess(task.projectId.toString(), userId);

  Object.assign(task, input);
  await task.save();

  return toTaskDTO(task);
}

export async function deleteTask(taskId: string, userId: string): Promise<void> {
  const task = await Task.findById(taskId);
  if (!task) {
    throw AppError.notFound('Task not found');
  }

  await verifyProjectAccess(task.projectId.toString(), userId);
  await Task.deleteOne({ _id: taskId });
}

export async function getKanbanBoard(projectId: string, userId: string) {
  await verifyProjectAccess(projectId, userId);

  const tasks = await Task.find({ projectId }).sort({ updatedAt: -1 });

  const board: Record<TaskStatus, TaskDTO[]> = {
    [TaskStatus.TODO]: [],
    [TaskStatus.IN_PROGRESS]: [],
    [TaskStatus.REVIEW]: [],
    [TaskStatus.DONE]: [],
  };

  for (const task of tasks) {
    board[task.status].push(toTaskDTO(task));
  }

  return board;
}
