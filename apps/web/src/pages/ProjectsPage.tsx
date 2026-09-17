import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, Github } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Project, PaginatedResponse, ProjectTechStack } from '@devflow/shared';
import { formatDate } from '@/lib/utils';

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<PaginatedResponse<Project>>('/projects'),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post<Project>('/projects', {
        name,
        description,
        techStack: ProjectTechStack.MERN,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setOpen(false);
      setName('');
      setDescription('');
    },
  });

  const projects = data?.items ?? [];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) create.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="mt-1 text-text-muted">Manage your development projects and teams</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {open && (
        <form onSubmit={submit} className="max-w-xl space-y-3 rounded-xl border border-border bg-surface p-5">
          <Input label="Project name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you building?"
          />
          <Button type="submit" isLoading={create.isPending}>
            Create workspace
          </Button>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-text-muted">Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group rounded-xl border border-border bg-surface p-6 hover:border-primary/30 hover:bg-surface-hover transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <FolderKanban className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="info">{project.techStack}</Badge>
              </div>
              <h3 className="mt-4 text-lg font-semibold group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <p className="mt-1 text-sm text-text-muted line-clamp-2">{project.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
                {project.githubRepoName ? (
                  <span className="flex items-center gap-1">
                    <Github className="h-3 w-3" />
                    {project.githubRepoName}
                  </span>
                ) : (
                  <span>{project.members.length} members</span>
                )}
                <span>Updated {formatDate(project.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
