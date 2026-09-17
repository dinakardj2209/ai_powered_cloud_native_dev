import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChatMessage, Project, TeamMember, UserRole } from '@devflow/shared';
import { getSocket } from '@/lib/socket';
import { getInitials } from '@/lib/utils';

export function ProjectTeamPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [chat, setChat] = useState('');

  const { data: members } = useQuery({
    queryKey: ['members', id],
    queryFn: () => api.get<TeamMember[]>(`/projects/${id}/members`),
    enabled: !!id,
  });

  const { data: messages } = useQuery({
    queryKey: ['chat', id],
    queryFn: () => api.get<ChatMessage[]>(`/projects/${id}/chat`),
    enabled: !!id,
  });

  useEffect(() => {
    const socket = getSocket();
    const onChat = () => queryClient.invalidateQueries({ queryKey: ['chat', id] });
    socket.on('chat', onChat);
    return () => {
      socket.off('chat', onChat);
    };
  }, [id, queryClient]);

  const invite = useMutation({
    mutationFn: () => api.post(`/projects/${id}/members`, { email, role: UserRole.DEVELOPER }),
    onSuccess: () => {
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['members', id] });
    },
  });

  const send = useMutation({
    mutationFn: () => api.post(`/projects/${id}/chat`, { content: chat }),
    onSuccess: () => {
      setChat('');
      queryClient.invalidateQueries({ queryKey: ['chat', id] });
    },
  });

  const submitInvite = (e: FormEvent) => {
    e.preventDefault();
    invite.mutate();
  };

  const submitChat = (e: FormEvent) => {
    e.preventDefault();
    if (chat.trim()) send.mutate();
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Members</h2>
        <p className="mt-1 text-sm text-text-muted">RBAC: ADMIN, DEVELOPER, VIEWER</p>
        <div className="mt-4 space-y-3">
          {(members ?? []).map((m) => (
            <div key={m.userId} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                {getInitials(m.name)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{m.name}</p>
                <p className="text-xs text-text-muted">{m.email}</p>
              </div>
              <Badge variant="info">{m.role}</Badge>
            </div>
          ))}
        </div>
        <form onSubmit={submitInvite} className="mt-4 flex gap-2">
          <Input placeholder="dev@devflow.dev" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" size="sm" isLoading={invite.isPending}>
            Invite
          </Button>
        </form>
      </section>

      <section className="flex min-h-[360px] flex-col rounded-xl border border-border bg-surface">
        <header className="border-b border-border px-5 py-4 font-semibold">Team chat</header>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {(messages ?? []).map((m) => (
            <div key={m.id}>
              <p className="text-xs text-text-muted">{m.userName}</p>
              <p className="text-sm">{m.content}</p>
            </div>
          ))}
        </div>
        <form onSubmit={submitChat} className="flex gap-2 border-t border-border p-4">
          <input
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            placeholder="Message the team"
          />
          <Button type="submit" isLoading={send.isPending}>
            Send
          </Button>
        </form>
      </section>
    </div>
  );
}

export function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [repo, setRepo] = useState('');

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get<Project>(`/projects/${id}`),
    enabled: !!id,
  });

  useEffect(() => {
    if (project?.githubRepoUrl) setRepo(project.githubRepoUrl);
  }, [project]);

  const save = useMutation({
    mutationFn: () => {
      const match = repo.match(/github\.com\/([^/]+\/[^/]+)/i);
      const githubRepoName = match ? match[1].replace(/\.git$/, '') : repo.replace(/^https?:\/\/github.com\//, '');
      return api.patch(`/projects/${id}`, { githubRepoUrl: repo, githubRepoName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['github', id] });
    },
  });

  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Connect GitHub repository</h2>
        <form
          className="space-y-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Input
            label="Repository URL"
            placeholder="https://github.com/org/food-delivery-app"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
          />
          <Button type="submit" size="sm" isLoading={save.isPending}>
            Save connection
          </Button>
          {save.isSuccess && <p className="text-xs text-success">Repository linked.</p>}
        </form>
      </div>
      <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Workspace settings</h2>
        <p className="text-sm text-text-muted">
          Secrets are loaded from environment variables and AWS Secrets Manager in production. Never commit
          <code className="mx-1 rounded bg-background px-1">.env</code> files.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-text-muted">
          <li>JWT access + refresh rotation in Redis</li>
          <li>Helmet, CORS, Zod validation, rate limiting</li>
          <li>RBAC enforced on AI and deploy routes</li>
        </ul>
      </div>
    </div>
  );
}
