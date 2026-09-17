import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GitCommitHorizontal, GitPullRequest, CircleDot, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { RepositorySnapshot } from '@devflow/shared';

function checkBadge(status: string) {
  if (status === 'passed') return <Badge variant="success">passed</Badge>;
  if (status === 'failed') return <Badge variant="danger">failed</Badge>;
  return <Badge variant="warning">pending</Badge>;
}

export function ProjectRepositoryPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['github', id],
    queryFn: () => api.get<RepositorySnapshot>(`/projects/${id}/github`),
    enabled: !!id,
  });

  if (isLoading || !data) {
    return <div className="py-12 text-center text-text-muted">Loading repository...</div>;
  }

  const latest = data.commits[0];

  return (
    <div className="space-y-6">
      {latest && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-xs uppercase tracking-wide text-text-muted">Latest commit</p>
          <h3 className="mt-2 text-lg font-semibold">{latest.message}</h3>
          <p className="mt-1 text-sm text-text-muted">
            {latest.author} · {latest.branch} · {latest.sha}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" /> Build {checkBadge(latest.checks.build)}
            </span>
            <span className="flex items-center gap-1.5">Tests {checkBadge(latest.checks.tests)}</span>
            <span className="flex items-center gap-1.5">Security {checkBadge(latest.checks.security)}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface">
          <header className="flex items-center gap-2 border-b border-border px-5 py-4 font-semibold">
            <GitCommitHorizontal className="h-4 w-4" /> Commits
          </header>
          <div className="divide-y divide-border">
            {data.commits.map((c) => (
              <div key={c.sha} className="px-5 py-3">
                <p className="text-sm font-medium">{c.message}</p>
                <p className="text-xs text-text-muted">
                  {c.author} · {c.branch} · {c.sha}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface">
          <header className="flex items-center gap-2 border-b border-border px-5 py-4 font-semibold">
            <GitPullRequest className="h-4 w-4" /> Pull requests
          </header>
          <div className="divide-y divide-border">
            {data.pullRequests.map((pr) => (
              <div key={pr.number} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">
                    #{pr.number} {pr.title}
                  </p>
                  <p className="text-xs text-text-muted">
                    {pr.sourceBranch} → {pr.targetBranch}
                  </p>
                </div>
                <Badge variant={pr.state === 'merged' ? 'info' : pr.state === 'open' ? 'success' : 'default'}>
                  {pr.state}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-surface">
        <header className="flex items-center gap-2 border-b border-border px-5 py-4 font-semibold">
          <CircleDot className="h-4 w-4" /> Issues
        </header>
        <div className="divide-y divide-border">
          {data.issues.map((issue) => (
            <div key={issue.number} className="flex items-center justify-between px-5 py-3">
              <p className="text-sm">
                #{issue.number} {issue.title}
              </p>
              <div className="flex gap-2">
                {issue.labels.map((l) => (
                  <span key={l} className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] text-text-muted">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
