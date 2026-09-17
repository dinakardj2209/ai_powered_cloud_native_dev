import { IUser } from './user.model';
import { UserProfile } from '@devflow/shared';

export function toUserProfile(user: IUser | Record<string, unknown>): UserProfile {
  const doc = user as IUser & { id?: string; _id?: { toString(): string } };
  const id = doc.id ?? doc._id?.toString() ?? '';

  return {
    id,
    email: doc.email,
    name: doc.name,
    role: doc.role,
    avatarUrl: doc.avatarUrl,
    githubUsername: doc.githubUsername,
    createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}
