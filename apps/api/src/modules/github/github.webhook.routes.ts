import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { Project } from '../projects/project.model';
import { logActivity } from '../activity/activity.service';
import { Notification } from '../notifications/notification.model';
import { emitToProject } from '../../services/socket.service';
import { env } from '../../config/env';

const router = Router();

function isValidSignature(rawBody: string, signatureHeader?: string): boolean {
  if (!env.github.webhookSecret) return true;
  if (!signatureHeader?.startsWith('sha256=')) return false;
  const expected = crypto
    .createHmac('sha256', env.github.webhookSecret)
    .update(rawBody)
    .digest('hex');
  const received = signatureHeader.slice('sha256='.length);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
  } catch {
    return false;
  }
}

router.post('/', async (req: Request, res: Response) => {
  const raw = (req as Request & { rawBody?: string }).rawBody ?? JSON.stringify(req.body ?? {});
  if (!isValidSignature(raw, req.headers['x-hub-signature-256'] as string | undefined)) {
    res.status(401).json({ success: false, error: { message: 'Invalid webhook signature', code: 'INVALID_SIGNATURE' } });
    return;
  }

  const event = String(req.headers['x-github-event'] ?? 'push');
  const payload = req.body as {
    repository?: { full_name?: string; html_url?: string };
    pusher?: { name?: string };
    commits?: Array<{ message?: string }>;
    pull_request?: { number?: number; title?: string; user?: { login?: string } };
    action?: string;
  };

  const repoName = payload.repository?.full_name ?? payload.repository?.html_url;
  if (!repoName) {
    res.status(202).json({ success: true, data: { ignored: true } });
    return;
  }

  const project = await Project.findOne({
    $or: [{ githubRepoName: repoName }, { githubRepoName: repoName.split('/').pop() }],
  });

  if (!project) {
    res.status(202).json({ success: true, data: { ignored: true, reason: 'no matching project' } });
    return;
  }

  const actor = payload.pusher?.name ?? payload.pull_request?.user?.login ?? 'GitHub';
  const detail =
    event === 'pull_request'
      ? `PR #${payload.pull_request?.number} ${payload.action}: ${payload.pull_request?.title}`
      : payload.commits?.[0]?.message ?? `${event} received`;

  await logActivity({
    projectId: project._id.toString(),
    userName: actor,
    action: event === 'pull_request' ? 'updated a pull request' : 'pushed a commit',
    detail,
  });

  const notification = await Notification.create({
    userId: project.ownerId,
    type: 'github',
    title: `GitHub ${event}`,
    body: detail,
    projectId: project._id,
  });

  emitToProject(project._id.toString(), 'notification', {
    id: notification._id.toString(),
    type: 'github',
    title: notification.title,
    body: notification.body,
  });

  res.json({ success: true, data: { projectId: project._id.toString(), event } });
});

export default router;
