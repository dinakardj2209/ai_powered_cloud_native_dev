import { Router, Request, Response } from 'express';
import { chatMessageSchema } from '@devflow/shared';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { ChatMessage } from './chat.model';
import { Project } from '../projects/project.model';
import { User } from '../users/user.model';
import { AppError } from '../../utils/AppError';
import { emitToProject } from '../../services/socket.service';
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

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    await assertMember(routeParam(req, 'projectId'), req.user!.userId);
    const items = await ChatMessage.find({ projectId: routeParam(req, 'projectId') }).sort({ createdAt: 1 }).limit(100);
    res.json({
      success: true,
      data: items.map((m) => ({
        id: m._id.toString(),
        projectId: m.projectId.toString(),
        userId: m.userId.toString(),
        userName: m.userName,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  }),
);

router.post(
  '/',
  validate(chatMessageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await assertMember(routeParam(req, 'projectId'), req.user!.userId);
    const user = await User.findById(req.user!.userId);
    const userName = user?.name ?? req.user!.email;
    const msg = await ChatMessage.create({
      projectId: routeParam(req, 'projectId'),
      userId: req.user!.userId,
      userName,
      content: req.body.content,
    });
    const dto = {
      id: msg._id.toString(),
      projectId: routeParam(req, 'projectId'),
      userId: req.user!.userId,
      userName,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    };
    emitToProject(routeParam(req, 'projectId'), 'chat', dto);
    res.status(201).json({ success: true, data: dto });
  }),
);

export default router;
