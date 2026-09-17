import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Github, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Project } from '@devflow/shared';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { joinProject, leaveProject } from '@/lib/socket';

const tabs = [
  { to: '', label: 'Overview', end: true },
  { to: 'tasks', label: 'Tasks' },
  { to: 'repository', label: 'Repository' },
  { to: 'ai', label: 'AI Assistant' },
  { to: 'deployments', label: 'Deployments' },
  { to: 'monitoring', label: 'Monitoring' },
  { to: 'team', label: 'Team' },
  { to: 'settings', label: 'Settings' },
];

export function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get<Project>(`/projects/${id}`),
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) return;
    joinProject(id);
    return () => leaveProject(id);
  }, [id]);

  if (isLoading) {
    return <div className="py-12 text-center text-text-muted">Loading workspace...</div>;
  }
  if (!project) {
    return <div className="py-12 text-center text-text-muted">Project not found</div>;
  }

  return (
    <div className="space-y-6">
      <NavLink
        to="/projects"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </NavLink>

      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant="info">{project.techStack}</Badge>
              <Badge variant="success">{project.status}</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-text-muted">{project.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-muted">
              {project.githubRepoName && (
                <span className="flex items-center gap-1.5">
                  <Github className="h-4 w-4" />
                  {project.githubRepoName}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {project.members.length} members
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-text-muted hover:text-text',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
