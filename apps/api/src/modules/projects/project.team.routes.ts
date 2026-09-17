import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { listActivity } from '../activity/activity.service';
import { Project } from '../projects/project.model';
import { User } from '../users/user.model';
import { inviteMemberSchema, UserRole } from '@devflow/shared';
import { validate } from '../../middleware/validate.middleware';
import { AppError } from '../../utils/AppError';
import { cacheDelete } from '../../services/redis.service';
import { toUserProfile } from '../users/user.mapper';
import { routeParam } from '../../utils/params';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get(
  '/activity',
  asyncHandler(async (req: Request, res: Response) => {
    const data = await listActivity(routeParam(req, 'projectId'));
    res.json({ success: true, data });
  }),
);

router.get(
  '/members',
  asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findById(routeParam(req, 'projectId'));
    if (!project) throw AppError.notFound('Project not found');
    const ids = [project.ownerId, ...project.members.map((m) => m.userId)];
    const users = await User.find({ _id: { $in: ids } });
    const byId = new Map(users.map((u) => [u._id.toString(), u]));
    const data = project.members.map((m) => {
      const user = byId.get(m.userId.toString());
      return {
        userId: m.userId.toString(),
        name: user?.name ?? 'Unknown',
        email: user?.email ?? '',
        role: m.role,
        githubUsername: user?.githubUsername,
        joinedAt: m.joinedAt.toISOString(),
      };
    });
    res.json({ success: true, data, meta: { owner: toUserProfile(byId.get(project.ownerId.toString()) as never) } });
  }),
);

router.post(
  '/members',
  validate(inviteMemberSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findById(routeParam(req, 'projectId'));
    if (!project) throw AppError.notFound('Project not found');
    if (project.ownerId.toString() !== req.user!.userId && req.user!.role !== UserRole.ADMIN) {
      throw AppError.forbidden('Only owners or admins can invite members');
    }
    const user = await User.findOne({ email: req.body.email });
    if (!user) throw AppError.notFound('User not found');
    const exists = project.members.some((m) => m.userId.toString() === user._id.toString());
    if (!exists) {
      project.members.push({ userId: user._id, role: req.body.role, joinedAt: new Date() });
      await project.save();
      await cacheDelete(`project:${project.id}`);
    }
    res.status(201).json({ success: true, data: { userId: user._id.toString(), role: req.body.role } });
  }),
);

export default router;
