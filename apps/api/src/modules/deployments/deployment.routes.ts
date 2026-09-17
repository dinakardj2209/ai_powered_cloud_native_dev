import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import * as deploymentService from './deployment.service';
import { routeParam } from '../../utils/params';

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const data = await deploymentService.listDeployments(routeParam(req, 'projectId'), req.user!.userId);
    res.json({ success: true, data });
  }),
);

router.get(
  '/latest',
  asyncHandler(async (req: Request, res: Response) => {
    const data = await deploymentService.getDeployment(routeParam(req, 'projectId'), req.user!.userId);
    res.json({ success: true, data });
  }),
);

router.post(
  '/',
  requirePermission('deploy:trigger'),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await deploymentService.triggerDeployment(
      routeParam(req, 'projectId'),
      req.user!.userId,
      req.user!.email,
    );
    res.status(201).json({ success: true, data, message: 'Deployment triggered' });
  }),
);

export default router;
