import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { NotificationItem } from '@devflow/shared';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<NotificationItem[]>('/notifications'),
    refetchInterval: 20000,
  });
  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = (data ?? []).filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-text"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button
                className="text-xs text-primary hover:text-primary-hover"
                onClick={() => markAll.mutate()}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {(data ?? []).map((n) => (
              <div key={n.id} className="border-b border-border px-4 py-3 last:border-0">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-text-muted">{n.body}</p>
              </div>
            ))}
            {!data?.length && <p className="p-4 text-sm text-text-muted">No notifications</p>}
          </div>
        </div>
      )}
    </div>
  );
}
