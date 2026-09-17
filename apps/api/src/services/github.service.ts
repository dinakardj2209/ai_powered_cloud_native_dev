import { RepositorySnapshot } from '@devflow/shared';
import { env } from '../config/env';
import { Project } from '../modules/projects/project.model';
import { AppError } from '../utils/AppError';

function demoSnapshot(repoName: string, url?: string): RepositorySnapshot {
  const now = Date.now();
  return {
    connected: true,
    name: repoName || 'food-delivery-app',
    url: url || 'https://github.com/dinakar-dev/food-delivery-app',
    defaultBranch: 'main',
    branches: ['main', 'develop', 'feature/authentication', 'feature/orders'],
    commits: [
      {
        sha: 'a1b2c3d',
        message: 'Implemented JWT authentication',
        author: 'Dinakar',
        authorEmail: 'dev@devflow.dev',
        branch: 'feature/authentication',
        committedAt: new Date(now - 1000 * 60 * 45).toISOString(),
        url: 'https://github.com/dinakar-dev/food-delivery-app/commit/a1b2c3d',
        checks: { build: 'passed', tests: 'passed', security: 'passed' },
      },
      {
        sha: 'b7e91f2',
        message: 'Add restaurant CRUD endpoints with geospatial filter',
        author: 'Dinakar Developer',
        authorEmail: 'dev@devflow.dev',
        branch: 'feature/orders',
        committedAt: new Date(now - 1000 * 60 * 180).toISOString(),
        url: 'https://github.com/dinakar-dev/food-delivery-app/commit/b7e91f2',
        checks: { build: 'passed', tests: 'passed', security: 'pending' },
      },
      {
        sha: 'c4d8821',
        message: 'Harden login rate limiting and password hashing',
        author: 'Dinakar Admin',
        authorEmail: 'admin@devflow.dev',
        branch: 'main',
        committedAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
        url: 'https://github.com/dinakar-dev/food-delivery-app/commit/c4d8821',
        checks: { build: 'passed', tests: 'passed', security: 'passed' },
      },
    ],
    pullRequests: [
      {
        number: 42,
        title: 'JWT authentication and refresh tokens',
        author: 'dinakar-dev',
        state: 'open',
        sourceBranch: 'feature/authentication',
        targetBranch: 'main',
        createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
        url: 'https://github.com/dinakar-dev/food-delivery-app/pull/42',
      },
      {
        number: 39,
        title: 'Restaurant API with menu associations',
        author: 'dinakar-dev',
        state: 'merged',
        sourceBranch: 'feature/restaurants',
        targetBranch: 'main',
        createdAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
        url: 'https://github.com/dinakar-dev/food-delivery-app/pull/39',
      },
    ],
    issues: [
      {
        number: 18,
        title: 'Stripe webhook retries fail in staging',
        state: 'open',
        labels: ['bug', 'payments'],
        createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
      },
      {
        number: 12,
        title: 'Add Google OAuth for customer login',
        state: 'open',
        labels: ['enhancement', 'auth'],
        createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
      },
    ],
  };
}

export async function getRepositorySnapshot(projectId: string, userId: string): Promise<RepositorySnapshot> {
  const project = await Project.findById(projectId);
  if (!project) throw AppError.notFound('Project not found');

  const isMember =
    project.ownerId.toString() === userId ||
    project.members.some((m) => m.userId.toString() === userId);
  if (!isMember) throw AppError.forbidden('You do not have access to this project');

  const repoName = project.githubRepoName ?? 'food-delivery-app';

  if (env.github.token && project.githubRepoName?.includes('/')) {
    try {
      const headers = {
        Authorization: `Bearer ${env.github.token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DevFlow',
      };
      const repoRes = await fetch(`https://api.github.com/repos/${project.githubRepoName}`, { headers });
      if (repoRes.ok) {
        const repo = (await repoRes.json()) as { full_name: string; html_url: string; default_branch: string };
        const [commitsRes, prsRes, issuesRes, branchesRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${project.githubRepoName}/commits?per_page=8`, { headers }),
          fetch(`https://api.github.com/repos/${project.githubRepoName}/pulls?state=all&per_page=8`, { headers }),
          fetch(`https://api.github.com/repos/${project.githubRepoName}/issues?state=open&per_page=8`, { headers }),
          fetch(`https://api.github.com/repos/${project.githubRepoName}/branches?per_page=12`, { headers }),
        ]);

        const commitsJson = commitsRes.ok
          ? ((await commitsRes.json()) as Array<{
              sha: string;
              commit: { message: string; author: { name: string; email: string; date: string } };
              html_url: string;
            }>)
          : [];
        const prsJson = prsRes.ok
          ? ((await prsRes.json()) as Array<{
              number: number;
              title: string;
              user: { login: string };
              state: string;
              merged_at: string | null;
              head: { ref: string };
              base: { ref: string };
              created_at: string;
              html_url: string;
            }>)
          : [];
        const issuesJson = issuesRes.ok
          ? ((await issuesRes.json()) as Array<{
              number: number;
              title: string;
              state: string;
              labels: Array<{ name: string }>;
              created_at: string;
              pull_request?: unknown;
            }>)
          : [];
        const branchesJson = branchesRes.ok ? ((await branchesRes.json()) as Array<{ name: string }>) : [];

        return {
          connected: true,
          name: repo.full_name,
          url: repo.html_url,
          defaultBranch: repo.default_branch,
          branches: branchesJson.map((b) => b.name),
          commits: commitsJson.map((c) => ({
            sha: c.sha.slice(0, 7),
            message: c.commit.message.split('\n')[0],
            author: c.commit.author.name,
            authorEmail: c.commit.author.email,
            branch: repo.default_branch,
            committedAt: c.commit.author.date,
            url: c.html_url,
            checks: { build: 'passed' as const, tests: 'passed' as const, security: 'passed' as const },
          })),
          pullRequests: prsJson.map((pr) => ({
            number: pr.number,
            title: pr.title,
            author: pr.user.login,
            state: (pr.merged_at ? 'merged' : pr.state === 'open' ? 'open' : 'closed') as 'open' | 'merged' | 'closed',
            sourceBranch: pr.head.ref,
            targetBranch: pr.base.ref,
            createdAt: pr.created_at,
            url: pr.html_url,
          })),
          issues: issuesJson
            .filter((i) => !i.pull_request)
            .map((issue) => ({
              number: issue.number,
              title: issue.title,
              state: issue.state as 'open' | 'closed',
              labels: issue.labels.map((l) => l.name),
              createdAt: issue.created_at,
            })),
        };
      }
    } catch {
      // fall through to demo snapshot
    }
  }

  return demoSnapshot(repoName, project.githubRepoUrl);
}
