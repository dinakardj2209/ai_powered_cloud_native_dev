import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export function AuthCallbackPage() {
  const [params] = useSearchParams();

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (!accessToken || !refreshToken) {
      window.location.replace('/login?error=github');
      return;
    }
    api.setTokens(accessToken, refreshToken);
    window.location.replace('/dashboard');
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center gap-3 text-text-muted">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      Connecting GitHub…
    </div>
  );
}
