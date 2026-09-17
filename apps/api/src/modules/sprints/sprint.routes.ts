import { Router, Request, Response } from 'express';
import { createSprintSchema, SprintStatus } from '@devflow/shared';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { Sprint } from './sprint.model';
import { Project } from '../projects/project.model';
import { AppError } from '../../utils/AppError';
import { routeParam } from '../../utils/params';

const router = Router({ mergeParams: true });
router.use(authenticate);

async function assertMember(projectId: string, userId: string) {
  const project = await Project.findById(projectId);
  if (!project) throw AppError.notFound('Project not found');
  const ok =
    project.ownerId.toString() === userId ||
    project.members.some((m) => m.userId.toString() === userId);
  if (!ok) throw AppError.forbidden('You do not have access to this project');
}

function toDto(s: InstanceType<typeof Sprint>) {
  return {
    id: s._id.toString(),
    projectId: s.projectId.toString(),
    name: s.name,
    goal: s.goal,
    status: s.status,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
  };
}

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    await assertMember(routeParam(req, 'projectId'), req.user!.userId);
    const items = await Sprint.find({ projectId: routeParam(req, 'projectId') }).sort({ startDate: -1 });
    res.json({ success: true, data: items.map(toDto) });
  }),
);

router.post(
  '/',
  validate(createSprintSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await assertMember(routeParam(req, 'projectId'), req.user!.userId);
    const start = req.body.startDate ? new Date(req.body.startDate) : new Date();
    const end = req.body.endDate ? new Date(req.body.endDate) : new Date(Date.now() + 14 * 86400000);
    const sprint = await Sprint.create({
      projectId: routeParam(req, 'projectId'),
      name: req.body.name,
      goal: req.body.goal,
      status: SprintStatus.ACTIVE,
      startDate: start,
      endDate: end,
    });
    res.status(201).json({ success: true, data: toDto(sprint) });
  }),
);

export default router;
