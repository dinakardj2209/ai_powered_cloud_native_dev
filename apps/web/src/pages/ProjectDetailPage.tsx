import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Github, Users, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { Project, Task, TaskStatus } from '@devflow/shared';

interface ProjectStats {
  project: Project;
  taskStats: Record<TaskStatus, number>;
  totalTasks: number;
  completionRate: number;
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get<Project>(`/projects/${id}`),
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ['project-stats', id],
    queryFn: () => api.get<ProjectStats>(`/projects/${id}/stats`),
    enabled: !!id,
  });

  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ['kanban', id],
    queryFn: () => api.get<Record<TaskStatus, Task[]>>(`/projects/${id}/tasks/board`),
    enabled: !!id,
  });

  if (projectLoading) {
    return <div className="text-center py-12 text-text-muted">Loading project...</div>;
  }

  if (!project) {
    return <div className="text-center py-12 text-text-muted">Project not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Project header */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant="info">{project.techStack}</Badge>
            </div>
            <p className="mt-2 text-text-muted max-w-2xl">{project.description}</p>

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

          {stats && (
            <div className="flex items-center gap-6 rounded-lg border border-border bg-background/50 px-6 py-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.completionRate}%</p>
                <p className="text-xs text-text-muted">Complete</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
                <p className="text-xs text-text-muted">Total Tasks</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <BarChart3 className="h-5 w-5 text-success mx-auto" />
                <p className="text-xs text-text-muted mt-1">{stats.taskStats.DONE} done</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kanban board */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Task Board</h2>
        {boardLoading ? (
          <div className="text-center py-12 text-text-muted">Loading tasks...</div>
        ) : board ? (
          <KanbanBoard board={board} />
        ) : null}
      </div>
    </div>
  );
}
