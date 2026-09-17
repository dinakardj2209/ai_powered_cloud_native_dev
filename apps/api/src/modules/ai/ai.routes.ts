import { Router, Request, Response } from 'express';
import { aiChatSchema, aiCodeReviewSchema, aiGenerateTasksSchema, aiPrSummarySchema } from '@devflow/shared';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { chatAboutProject, reviewCode, generateTaskPlan, generateDocumentation, summarizePullRequest } from '../../services/ai.service';
import { Task } from '../tasks/task.model';
import { UserRole } from '@devflow/shared';
import { routeParam } from '../../utils/params';

const router = Router({ mergeParams: true });
router.use(authenticate);
router.use(requirePermission('ai:use'));

router.post(
  '/chat',
  validate(aiChatSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const assistant = await chatAboutProject(routeParam(req, 'projectId'), req.user!.userId, req.body.message);
    res.json({ success: true, data: assistant });
  }),
);

router.post(
  '/review',
  validate(aiCodeReviewSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewCode(req.body.code, req.body.language);
    res.json({ success: true, data: result });
  }),
);

router.post(
  '/generate-tasks',
  validate(aiGenerateTasksSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const plan = generateTaskPlan(req.body.prompt);
    res.json({ success: true, data: plan });
  }),
);

router.post(
  '/generate-tasks/apply',
  validate(aiGenerateTasksSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (req.user!.role === UserRole.VIEWER) {
      res.status(403).json({ success: false, error: { message: 'Viewers cannot create tasks', code: 'FORBIDDEN' } });
      return;
    }
    const plan = generateTaskPlan(req.body.prompt);
    const created = await Task.insertMany(
      plan.tasks.map((t) => ({
        projectId: routeParam(req, 'projectId'),
        title: t.title,
        description: t.description,
        priority: t.priority,
        tags: t.tags,
        createdById: req.user!.userId,
      })),
    );
    res.status(201).json({
      success: true,
      data: { epic: plan.epic, created: created.length },
      message: 'Tasks created from AI plan',
    });
  }),
);

router.post(
  '/docs',
  asyncHandler(async (req: Request, res: Response) => {
    const markdown = await generateDocumentation(routeParam(req, 'projectId'));
    res.json({ success: true, data: { markdown } });
  }),
);

router.post(
  '/pr-summary',
  validate(aiPrSummarySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const summary = await summarizePullRequest(req.body.title, req.body.diff);
    res.json({ success: true, data: { summary } });
  }),
);

export default router;
