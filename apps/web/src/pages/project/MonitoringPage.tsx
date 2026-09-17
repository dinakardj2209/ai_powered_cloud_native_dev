import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Activity, Database, Cpu, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { AiInsight, MonitoringError, MonitoringMetrics } from '@devflow/shared';

interface MonitoringPayload {
  metrics: MonitoringMetrics;
  errors: MonitoringError[];
  insight: AiInsight;
  redis: boolean;
  cloud: Record<string, string>;
}

export function ProjectMonitoringPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['monitoring', id],
    queryFn: () => api.get<MonitoringPayload>(`/projects/${id}/monitoring`),
    enabled: !!id,
    refetchInterval: 15000,
  });

  if (isLoading || !data) {
    return <div className="py-12 text-center text-text-muted">Loading metrics...</div>;
  }

  const m = data.metrics;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="API status" value={m.apiStatus} icon={Activity} ok />
        <Metric label="Database" value={m.database} icon={Database} ok={m.database === 'connected'} />
        <Metric label="CPU" value={`${m.cpuPercent}%`} icon={Cpu} />
        <Metric label="Response time" value={`${m.responseTimeMs}ms`} icon={Clock} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Memory" value={`${m.memoryPercent}%`} />
        <Stat label="Requests/min" value={m.requestsPerMin.toLocaleString()} />
        <Stat label="Error rate" value={`${m.errorRate}%`} />
        <Stat label="Cache hit rate" value={`${Math.round(m.cacheHitRate * 100)}%`} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="font-semibold">Redis caching impact</h3>
        <p className="mt-2 text-sm text-text-muted">
          Before caching: <span className="text-text">{m.uncachedLatencyMs}ms</span>
          {' · '}
          After caching: <span className="text-success">{m.cachedLatencyMs}ms</span>
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="font-semibold">AWS surface</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          {Object.entries(data.cloud).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="capitalize text-text-muted">{key}</span>
              <Badge variant="success">{value}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-warning/20 bg-warning/5 p-6">
        <div className="flex items-center gap-2">
          <Badge variant={data.insight.severity === 'warning' ? 'warning' : 'info'}>
            AI + monitoring
          </Badge>
          <h3 className="font-semibold">{data.insight.title}</h3>
        </div>
        <p className="mt-2 text-sm text-text-muted">{data.insight.summary}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {data.insight.suggestedActions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4 font-semibold">Recent errors</div>
        {data.errors.map((err) => (
          <div key={err.path + err.status} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0">
            <div>
              <p className="text-sm font-medium">
                {err.status} {err.message}
              </p>
              <p className="text-xs text-text-muted">
                {err.method} {err.path}
              </p>
            </div>
            <Badge variant="danger">{err.occurrences} occurrences</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  ok,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
  ok?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className={`mt-2 text-lg font-semibold capitalize ${ok === false ? 'text-danger' : ''}`}>{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
