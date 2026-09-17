import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { Project } from '../projects/project.model';
import { Task } from '../tasks/task.model';
import { Deployment } from '../deployments/deployment.model';
import { isDatabaseConnected } from '../../config/database';
import { isRedisConnected } from '../../services/redis.service';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const filter = { $or: [{ ownerId: userId }, { 'members.userId': userId }], status: 'ACTIVE' };
    const projects = await Project.find(filter).select('_id');
    const ids = projects.map((p) => p._id);

    const [taskAgg, latestDeploy] = await Promise.all([
      Task.aggregate([{ $match: { projectId: { $in: ids } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Deployment.findOne({ projectId: { $in: ids } }).sort({ number: -1 }),
    ]);

    const counts: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };
    for (const row of taskAgg) counts[row._id] = row.count;

    res.json({
      success: true,
      data: {
        projectCount: projects.length,
        tasks: counts,
        latestDeployment: latestDeploy
          ? {
              number: latestDeploy.number,
              status: latestDeploy.status,
              commitMessage: latestDeploy.commitMessage,
            }
          : null,
        health: {
          api: true,
          mongodb: isDatabaseConnected(),
          redis: isRedisConnected(),
          github: true,
          ai: true,
        },
      },
    });
  }),
);

export default router;
