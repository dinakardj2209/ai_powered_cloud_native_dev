import { TaskStatus, Task, TASK_STATUS_ORDER } from '@devflow/shared';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; badgeVariant: 'default' | 'info' | 'warning' | 'success' }
> = {
  [TaskStatus.TODO]: { label: 'To Do', color: 'border-t-text-muted', badgeVariant: 'default' },
  [TaskStatus.IN_PROGRESS]: { label: 'In Progress', color: 'border-t-warning', badgeVariant: 'warning' },
  [TaskStatus.REVIEW]: { label: 'Review', color: 'border-t-primary', badgeVariant: 'info' },
  [TaskStatus.DONE]: { label: 'Done', color: 'border-t-success', badgeVariant: 'success' },
};

const PRIORITY_VARIANT: Record<string, 'default' | 'warning' | 'danger'> = {
  LOW: 'default',
  MEDIUM: 'default',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

interface KanbanBoardProps {
  board: Record<TaskStatus, Task[]>;
  onMove?: (taskId: string, status: TaskStatus) => void;
}

export function KanbanBoard({ board, onMove }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUS_ORDER.map((status) => {
        const config = STATUS_CONFIG[status];
        const tasks = board[status] ?? [];

        return (
          <div key={status} className="flex flex-col">
            <div
              className={cn(
                'flex items-center justify-between rounded-t-xl border border-b-0 border-border bg-surface px-4 py-3 border-t-4',
                config.color,
              )}
            >
              <h3 className="text-sm font-semibold">{config.label}</h3>
              <span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs text-text-muted">
                {tasks.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 rounded-b-xl border border-border bg-background/50 p-3 min-h-[200px]">
              {tasks.length === 0 ? (
                <p className="text-center text-xs text-text-muted py-8">No tasks</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-border bg-surface p-4 hover:border-border-hover transition-colors"
                  >
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.description && (
                      <p className="mt-1 text-xs text-text-muted line-clamp-2">{task.description}</p>
                    )}
                    {onMove && (
                      <select
                        className="mt-3 w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-text-muted"
                        value={task.status}
                        onChange={(e) => onMove(task.id, e.target.value as TaskStatus)}
                      >
                        {TASK_STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_CONFIG[s].label}
                          </option>
                        ))}
                      </select>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant={PRIORITY_VARIANT[task.priority]}>{task.priority}</Badge>
                      {task.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] text-text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
