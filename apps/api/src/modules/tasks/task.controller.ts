import { Request, Response } from 'express';
import { paginationSchema } from '@devflow/shared';
import { asyncHandler } from '../../utils/asyncHandler';
import { routeParam } from '../../utils/params';
import * as taskService from './task.service';

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.createTask(
    routeParam(req, 'projectId'),
    req.user!.userId,
    req.body,
  );

  res.status(201).json({
    success: true,
    data: task,
    message: 'Task created successfully',
  });
});

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = paginationSchema.parse(req.query);
  const result = await taskService.getTasksByProject(
    routeParam(req, 'projectId'),
    req.user!.userId,
    page,
    limit,
  );

  res.json({ success: true, data: result });
});

export const getKanbanBoard = asyncHandler(async (req: Request, res: Response) => {
  const board = await taskService.getKanbanBoard(
    routeParam(req, 'projectId'),
    req.user!.userId,
  );

  res.json({ success: true, data: board });
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.getTaskById(routeParam(req, 'taskId'), req.user!.userId);

  res.json({ success: true, data: task });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await taskService.updateTask(
    routeParam(req, 'taskId'),
    req.user!.userId,
    req.body,
  );

  res.json({
    success: true,
    data: task,
    message: 'Task updated successfully',
  });
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  await taskService.deleteTask(routeParam(req, 'taskId'), req.user!.userId);

  res.json({
    success: true,
    data: null,
    message: 'Task deleted successfully',
  });
});
