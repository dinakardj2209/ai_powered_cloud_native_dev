import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { Notification } from './notification.model';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const items = await Notification.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).limit(40);
    res.json({
      success: true,
      data: items.map((n) => ({
        id: n._id.toString(),
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        projectId: n.projectId?.toString(),
        createdAt: n.createdAt.toISOString(),
      })),
    });
  }),
);

router.patch(
  '/:id/read',
  asyncHandler(async (req: Request, res: Response) => {
    await Notification.updateOne({ _id: req.params.id, userId: req.user!.userId }, { read: true });
    res.json({ success: true, data: null });
  }),
);

router.post(
  '/read-all',
  asyncHandler(async (req: Request, res: Response) => {
    await Notification.updateMany({ userId: req.user!.userId }, { read: true });
    res.json({ success: true, data: null });
  }),
);

export default router;
