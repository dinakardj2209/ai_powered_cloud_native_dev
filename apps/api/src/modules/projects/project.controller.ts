import { Request, Response } from 'express';
import { paginationSchema } from '@devflow/shared';
import { asyncHandler } from '../../utils/asyncHandler';
import { routeParam } from '../../utils/params';
import * as projectService from './project.service';

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.createProject(req.user!.userId, req.body);

  res.status(201).json({
    success: true,
    data: project,
    message: 'Project created successfully',
  });
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = paginationSchema.parse(req.query);
  const result = await projectService.getProjects(req.user!.userId, page, limit);

  res.json({ success: true, data: result });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.getProjectById(routeParam(req, 'id'), req.user!.userId);

  res.json({ success: true, data: project });
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.updateProject(
    routeParam(req, 'id'),
    req.user!.userId,
    req.body,
  );

  res.json({
    success: true,
    data: project,
    message: 'Project updated successfully',
  });
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  await projectService.deleteProject(routeParam(req, 'id'), req.user!.userId);

  res.json({
    success: true,
    data: null,
    message: 'Project archived successfully',
  });
});

export const getProjectStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await projectService.getProjectStats(routeParam(req, 'id'), req.user!.userId);

  res.json({ success: true, data: stats });
});
