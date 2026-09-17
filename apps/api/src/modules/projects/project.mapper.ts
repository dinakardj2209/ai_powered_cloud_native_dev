import { IProject } from './project.model';
import { Project } from '@devflow/shared';

export function toProjectDTO(project: IProject): Project {
  return {
    id: project.id ?? project._id.toString(),
    name: project.name,
    description: project.description,
    techStack: project.techStack,
    status: project.status,
    ownerId: project.ownerId.toString(),
    members: project.members.map((m) => ({
      userId: m.userId.toString(),
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    })),
    githubRepoUrl: project.githubRepoUrl,
    githubRepoName: project.githubRepoName,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
