import { Link } from 'react-router-dom';
import { Zap, GitBranch, Bot, Rocket, Activity, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const features = [
  {
    icon: GitBranch,
    title: 'GitHub, in context',
    body: 'Commits, PRs, issues, and CI checks live next to the tasks they belong to.',
  },
  {
    icon: Bot,
    title: 'Project-aware AI',
    body: 'Reviews, task generation, and docs use your board and repository — not a generic chat box.',
  },
  {
    icon: Rocket,
    title: 'CI/CD visibility',
    body: 'See lint, tests, Docker, and deploy steps the way GitHub Actions actually ran them.',
  },
  {
    icon: Activity,
    title: 'Observability',
    body: 'Health, latency, Redis cache impact, and AI root-cause hints in one monitoring view.',
  },
  {
    icon: Shield,
    title: 'Production security',
    body: 'JWT + refresh in Redis, RBAC, rate limits, Helmet, and Zod on every write.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold">DevFlow</p>
            <p className="text-xs text-text-muted">AI-powered developer platform</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link to="/register">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <section className="py-16 md:py-24">
          <p className="text-sm font-medium text-primary">GitHub + Jira + CI + AWS monitoring</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Ship software in one workspace — not eight tabs.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-text-muted">
            DevFlow unifies projects, GitHub activity, AI code review, pipelines, and cloud health
            into a Linear-style dashboard built for interviews and real teams.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login">
              <Button size="lg">Open demo</Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="secondary">
                Create workspace
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-text-muted">Demo: admin@devflow.dev / Admin@123</p>
        </section>

        <section className="mb-16 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="border-b border-border px-6 py-4 text-sm text-text-muted">Food Delivery Platform · BUILD #142 · SUCCESS</div>
          <div className="grid gap-px bg-border md:grid-cols-4">
            {[
              ['API', 'Healthy'],
              ['MongoDB', 'Connected'],
              ['Redis', '95ms cached'],
              ['Error rate', '0.7%'],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface p-5">
                <p className="text-xs text-text-muted">{label}</p>
                <p className="mt-1 text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="border-b border-border px-6 py-4 text-sm text-text-muted">Food Delivery Platform · workspace preview</div>
          <div className="grid gap-px bg-border md:grid-cols-4">
            {[
              ['TASK-101', 'Create user authentication', 'DONE'],
              ['TASK-102', 'Create restaurant API', 'IN PROGRESS'],
              ['TASK-103', 'Implement food ordering', 'IN PROGRESS'],
              ['TASK-104', 'Add payment integration', 'TODO'],
            ].map(([id, title, status]) => (
              <div key={id} className="bg-background p-5">
                <p className="text-xs text-primary">{id}</p>
                <p className="mt-2 text-sm font-medium">{title}</p>
                <p className="mt-3 text-xs text-text-muted">{status}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-border bg-surface p-6">
              <feature.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-4 font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm text-text-muted">{feature.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
