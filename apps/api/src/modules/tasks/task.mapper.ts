import { ITask } from './task.model';
import { Task } from '@devflow/shared';

export function toTaskDTO(task: ITask): Task {
  return {
    id: task.id ?? task._id.toString(),
    projectId: task.projectId.toString(),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assigneeId: task.assigneeId?.toString(),
    createdById: task.createdById.toString(),
    tags: task.tags,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
