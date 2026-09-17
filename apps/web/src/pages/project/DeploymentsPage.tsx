import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Circle, Rocket } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Deployment } from '@devflow/shared';
import { cn } from '@/lib/utils';

export function ProjectDeploymentsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: deployments, isLoading } = useQuery({
    queryKey: ['deployments', id],
    queryFn: () => api.get<Deployment[]>(`/projects/${id}/deployments`),
    enabled: !!id,
  });

  const trigger = useMutation({
    mutationFn: () => api.post(`/projects/${id}/deployments`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deployments', id] }),
  });

  const latest = deployments?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">CI/CD pipeline</h2>
        <Button size="sm" onClick={() => trigger.mutate()} isLoading={trigger.isPending}>
          <Rocket className="h-4 w-4" /> Trigger deploy
        </Button>
      </div>

      {latest && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted">BUILD #{latest.number}</p>
              <h3 className="mt-1 text-xl font-bold">{latest.commitMessage}</h3>
              <p className="text-sm text-text-muted">
                {latest.branch} · {latest.commitSha} · {latest.triggeredBy}
              </p>
            </div>
            <Badge variant={latest.status === 'SUCCESS' ? 'success' : 'danger'}>{latest.status}</Badge>
          </div>
          <ol className="mt-6 space-y-3">
            {latest.steps.map((step) => (
              <li key={step.name} className="flex items-center gap-3 text-sm">
                {step.status === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Circle className="h-4 w-4 text-text-muted" />
                )}
                <span className="flex-1">{step.name}</span>
                <span className="text-text-muted">{(step.durationMs / 1000).toFixed(1)}s</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {isLoading && <p className="text-text-muted">Loading deployments...</p>}

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4 font-semibold">History</div>
        {(deployments ?? []).map((d) => (
          <div key={d.id} className={cn('flex items-center justify-between border-b border-border px-5 py-3 last:border-0')}>
            <div>
              <p className="text-sm font-medium">#{d.number} {d.commitMessage}</p>
              <p className="text-xs text-text-muted">{d.environment} · {d.branch}</p>
            </div>
            <Badge variant={d.status === 'SUCCESS' ? 'success' : 'danger'}>{d.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
