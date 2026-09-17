import { Activity } from './activity.model';
import { emitToProject } from '../../services/socket.service';

export async function logActivity(params: {
  projectId: string;
  userId?: string;
  userName: string;
  action: string;
  detail: string;
}) {
  const activity = await Activity.create(params);
  const payload = {
    id: activity._id.toString(),
    projectId: params.projectId,
    userName: params.userName,
    action: params.action,
    detail: params.detail,
    createdAt: activity.createdAt.toISOString(),
  };
  emitToProject(params.projectId, 'activity', payload);
  return payload;
}

export async function listActivity(projectId: string, limit = 30) {
  const items = await Activity.find({ projectId }).sort({ createdAt: -1 }).limit(limit);
  return items.map((a) => ({
    id: a._id.toString(),
    projectId: a.projectId.toString(),
    userName: a.userName,
    action: a.action,
    detail: a.detail,
    createdAt: a.createdAt.toISOString(),
  }));
}
