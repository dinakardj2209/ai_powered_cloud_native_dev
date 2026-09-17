import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { getMonitoring } from './monitoring.service';
import { routeParam } from '../../utils/params';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const data = await getMonitoring(routeParam(req, 'projectId'), req.user!.userId);
    res.json({ success: true, data });
  }),
);

export default router;
