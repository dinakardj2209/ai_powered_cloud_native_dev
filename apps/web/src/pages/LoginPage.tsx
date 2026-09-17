import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Github, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@devflow.dev');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [githubUrl, setGithubUrl] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ configured: boolean; authorizeUrl: string | null }>('/auth/github')
      .then((data) => setGithubUrl(data.authorizeUrl))
      .catch(() => setGithubUrl(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-surface p-12 border-r border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">DevFlow</span>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">
            Your all-in-one<br />
            <span className="text-primary">developer platform</span>
          </h2>
          <p className="text-text-muted text-lg max-w-md">
            Manage projects, track GitHub activity, get AI-powered insights,
            and deploy to the cloud — all in one place.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            {['Project Management', 'GitHub Integration', 'AI Assistant', 'CI/CD Pipeline'].map(
              (feature) => (
                <div
                  key={feature}
                  className="rounded-lg border border-border bg-background/50 p-3 text-sm text-text-muted"
                >
                  ✓ {feature}
                </div>
              ),
            )}
          </div>
        </div>

        <p className="text-xs text-text-muted">
          Demo: admin@devflow.dev / Admin@123
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">DevFlow</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-text-muted">Sign in to your DevFlow account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Sign in
            </Button>
            {githubUrl ? (
              <a href={githubUrl} className="block">
                <Button type="button" variant="secondary" className="w-full" size="lg">
                  <Github className="h-4 w-4" /> Continue with GitHub
                </Button>
              </a>
            ) : (
              <p className="text-center text-xs text-text-muted">
                GitHub OAuth is optional — set GITHUB_CLIENT_ID to enable it.
              </p>
            )}
          </form>

          <p className="text-center text-sm text-text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:text-primary-hover font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
