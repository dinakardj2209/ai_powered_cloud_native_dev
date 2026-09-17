import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Project, PaginatedResponse } from '@devflow/shared';

interface DashboardStats {
  projectCount: number;
  tasks: Record<string, number>;
  latestDeployment: { number: number; status: string; commitMessage: string } | null;
  health: Record<string, boolean>;
}

export function DashboardPage() {
  const { user } = useAuth();

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<PaginatedResponse<Project>>('/projects'),
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardStats>('/dashboard'),
  });

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<{ status: string; services: Record<string, boolean> }>('/health'),
  });

  const projects = projectsData?.items ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="mt-1 text-text-muted">Projects, pipelines, and health in one workspace</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Projects', value: stats?.projectCount ?? projects.length, icon: FolderKanban, color: 'text-primary' },
          { label: 'Tasks Completed', value: stats?.tasks.DONE ?? '—', icon: CheckCircle2, color: 'text-success' },
          { label: 'In Progress', value: stats?.tasks.IN_PROGRESS ?? '—', icon: Clock, color: 'text-warning' },
          { label: 'Needs Review', value: stats?.tasks.REVIEW ?? '—', icon: AlertCircle, color: 'text-danger' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-muted">{stat.label}</p>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold">Your Projects</h2>
            <Link to="/projects" className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-6 text-center text-text-muted">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="p-6 text-center text-text-muted">No projects yet. Create your first project!</div>
            ) : (
              projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-surface-hover"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{project.name}</p>
                    <p className="truncate text-sm text-text-muted">{project.description}</p>
                  </div>
                  <Badge variant="info">{project.techStack}</Badge>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-6 py-4">
            <Activity className="h-4 w-4 text-success" />
            <h2 className="font-semibold">System Health</h2>
          </div>
          <div className="space-y-3 p-6">
            {[
              { label: 'API Status', ok: health?.services.api ?? true },
              { label: 'Database', ok: health?.services.mongodb ?? true },
              { label: 'Redis Cache', ok: health?.services.redis ?? false },
              { label: 'GitHub', ok: stats?.health.github ?? true },
              { label: 'AI Service', ok: stats?.health.ai ?? true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{item.label}</span>
                <Badge variant={item.ok ? 'success' : 'warning'}>{item.ok ? 'Healthy' : 'Degraded'}</Badge>
              </div>
            ))}
            {stats?.latestDeployment && (
              <p className="pt-2 text-xs text-text-muted">
                Latest build #{stats.latestDeployment.number}: {stats.latestDeployment.commitMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
