import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PaginatedResponse, Project } from '@devflow/shared';

export function FirstProjectRedirect({ tab }: { tab: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<PaginatedResponse<Project>>('/projects'),
  });

  if (isLoading) {
    return <div className="py-12 text-center text-text-muted">Loading workspace...</div>;
  }

  const first = data?.items[0];
  if (!first) {
    return <Navigate to="/projects" replace />;
  }

  const suffix = tab === 'overview' ? '' : `/${tab}`;
  return <Navigate to={`/projects/${first.id}${suffix}`} replace />;
}
