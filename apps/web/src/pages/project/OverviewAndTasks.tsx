import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Plus } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { Project, Task, TaskStatus, ActivityItem, Sprint } from '@devflow/shared';
import { useParams } from 'react-router-dom';

interface ProjectStats {
  project: Project;
  taskStats: Record<TaskStatus, number>;
  totalTasks: number;
  completionRate: number;
  insights?: { completionRate: number; focus: string; suggestion: string };
}

export function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();

  const { data: stats } = useQuery({
    queryKey: ['project-stats', id],
    queryFn: () => api.get<ProjectStats>(`/projects/${id}/stats`),
    enabled: !!id,
  });

  const { data: activity } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => api.get<ActivityItem[]>(`/projects/${id}/activity`),
    enabled: !!id,
  });

  const { data: sprints } = useQuery({
    queryKey: ['sprints', id],
    queryFn: () => api.get<Sprint[]>(`/projects/${id}/sprints`),
    enabled: !!id,
  });

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Complete', value: `${stats.completionRate}%` },
              { label: 'Total tasks', value: stats.totalTasks },
              { label: 'In progress', value: stats.taskStats.IN_PROGRESS },
              { label: 'Done', value: stats.taskStats.DONE },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-text-muted">{s.label}</p>
                <p className="mt-1 text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {stats?.insights && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">AI productivity insight</p>
            <p className="mt-2 font-medium">{stats.insights.focus}</p>
            <p className="mt-1 text-sm text-text-muted">{stats.insights.suggestion}</p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <BarChart3 className="h-4 w-4 text-primary" />
            Active sprint
          </h2>
          {sprints?.[0] ? (
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{sprints[0].name}</p>
                <Badge variant="info">{sprints[0].status}</Badge>
              </div>
              <p className="mt-2 text-sm text-text-muted">{sprints[0].goal}</p>
            </div>
          ) : (
            <p className="text-sm text-text-muted">No sprint yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-6 py-4 font-semibold">Team activity</div>
        <div className="divide-y divide-border">
          {(activity ?? []).slice(0, 8).map((item) => (
            <div key={item.id} className="px-6 py-3">
              <p className="text-sm">
                <span className="font-medium">{item.userName}</span>{' '}
                <span className="text-text-muted">{item.action}</span>
              </p>
              <p className="text-xs text-text-muted">{item.detail}</p>
            </div>
          ))}
          {!activity?.length && <p className="p-6 text-sm text-text-muted">No activity yet.</p>}
        </div>
      </div>
    </div>
  );
}

export function ProjectTasksPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  const { data: board, isLoading } = useQuery({
    queryKey: ['kanban', id],
    queryFn: () => api.get<Record<TaskStatus, Task[]>>(`/projects/${id}/tasks/board`),
    enabled: !!id,
  });

  const createTask = useMutation({
    mutationFn: () => api.post(`/projects/${id}/tasks`, { title, description: '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', id] });
      setTitle('');
      setOpen(false);
    },
  });

  const moveTask = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      api.patch(`/projects/${id}/tasks/${taskId}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kanban', id] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Task board</h2>
        <Button size="sm" onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4" />
          New task
        </Button>
      </div>
      {open && (
        <form
          className="flex max-w-xl gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) createTask.mutate();
          }}
        >
          <Input
            placeholder="Create user authentication"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button type="submit" isLoading={createTask.isPending}>
            Add
          </Button>
        </form>
      )}
      {isLoading || !board ? (
        <div className="py-12 text-center text-text-muted">Loading tasks...</div>
      ) : (
        <KanbanBoard board={board} onMove={(taskId, status) => moveTask.mutate({ taskId, status })} />
      )}
    </div>
  );
}
