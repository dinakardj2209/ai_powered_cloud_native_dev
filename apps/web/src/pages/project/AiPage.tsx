import { FormEvent, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Bot, Sparkles, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { AiChatMessage, CodeReviewResult, GeneratedTaskPlan } from '@devflow/shared';
import { Badge } from '@/components/ui/Badge';

const SAMPLE_CODE = `app.get("/users/:id", async (req, res) => {
    const user = await User.findById(req.params.id);
    res.json(user);
});`;

export function ProjectAiPage() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('Explain the authentication flow in my project.');
  const [code, setCode] = useState(SAMPLE_CODE);
  const [review, setReview] = useState<CodeReviewResult | null>(null);
  const [plan, setPlan] = useState<GeneratedTaskPlan | null>(null);
  const [feature, setFeature] = useState('I want to add Google authentication.');

  const chat = useMutation({
    mutationFn: () => api.post<AiChatMessage>(`/projects/${id}/ai/chat`, { message: input }),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', content: input, createdAt: new Date().toISOString() },
        data,
      ]);
    },
  });

  const reviewMut = useMutation({
    mutationFn: () => api.post<CodeReviewResult>(`/projects/${id}/ai/review`, { code, language: 'javascript' }),
    onSuccess: setReview,
  });

  const planMut = useMutation({
    mutationFn: () => api.post<GeneratedTaskPlan>(`/projects/${id}/ai/generate-tasks`, { prompt: feature }),
    onSuccess: setPlan,
  });

  const applyPlan = useMutation({
    mutationFn: () => api.post(`/projects/${id}/ai/generate-tasks/apply`, { prompt: feature }),
  });

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) chat.mutate();
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <section className="flex min-h-[420px] flex-col rounded-xl border border-border bg-surface">
        <header className="flex items-center gap-2 border-b border-border px-5 py-4 font-semibold">
          <Bot className="h-4 w-4 text-primary" /> Project-aware assistant
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.length === 0 && (
            <p className="text-sm text-text-muted">
              Ask about this repo, tasks, or architecture. The assistant uses your project context — not a generic chatbot.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-primary/10 text-text' : 'bg-background text-text-muted'
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-border p-4">
          <input
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" isLoading={chat.isPending}>
            Ask
          </Button>
        </form>
      </section>

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <Shield className="h-4 w-4" /> AI code review
          </h3>
          <textarea
            className="h-36 w-full rounded-lg border border-border bg-background p-3 font-mono text-xs"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button className="mt-3" size="sm" onClick={() => reviewMut.mutate()} isLoading={reviewMut.isPending}>
            Review snippet
          </Button>
          {review && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Score label="Quality" value={review.quality} />
                <Score label="Security" value={review.security} />
                <Score label="Performance" value={review.performance} />
                <Score label="Maintainability" value={review.maintainability} />
              </div>
              {review.issues.map((issue) => (
                <div key={issue.title} className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                  <p className="text-sm font-medium">⚠️ {issue.title}</p>
                  <p className="text-xs text-text-muted">{issue.detail}</p>
                </div>
              ))}
              <p className="text-sm text-text-muted">{review.suggestion}</p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4" /> Generate tasks
          </h3>
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={feature}
            onChange={(e) => setFeature(e.target.value)}
          />
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => planMut.mutate()} isLoading={planMut.isPending}>
              Generate
            </Button>
            {plan && (
              <Button size="sm" variant="secondary" onClick={() => applyPlan.mutate()} isLoading={applyPlan.isPending}>
                Add to board
              </Button>
            )}
          </div>
          {plan && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Epic: {plan.epic}</p>
              {plan.tasks.map((t) => (
                <div key={t.title} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <span className="text-sm">{t.title}</span>
                  <Badge>{t.priority}</Badge>
                </div>
              ))}
              {applyPlan.isSuccess && <p className="text-xs text-success">Tasks added to the board.</p>}
            </div>
          )}
        </section>

        <DocsAndPr projectId={id} />
      </div>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-lg font-bold">{value}/100</p>
    </div>
  );
}

function DocsAndPr({ projectId }: { projectId?: string }) {
  const [docs, setDocs] = useState('');
  const [prTitle, setPrTitle] = useState('JWT authentication and refresh tokens');
  const [summary, setSummary] = useState('');

  const docsMut = useMutation({
    mutationFn: () => api.post<{ markdown: string }>(`/projects/${projectId}/ai/docs`),
    onSuccess: (data) => setDocs(data.markdown),
  });

  const prMut = useMutation({
    mutationFn: () =>
      api.post<{ summary: string }>(`/projects/${projectId}/ai/pr-summary`, {
        title: prTitle,
        diff: SAMPLE_CODE,
      }),
    onSuccess: (data) => setSummary(data.summary),
  });

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-3 font-semibold">Docs & PR summaries</h3>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => docsMut.mutate()} isLoading={docsMut.isPending}>
          Generate README
        </Button>
        <Button size="sm" variant="secondary" onClick={() => prMut.mutate()} isLoading={prMut.isPending}>
          Summarize PR
        </Button>
      </div>
      <input
        className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        value={prTitle}
        onChange={(e) => setPrTitle(e.target.value)}
      />
      {docs && <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-text-muted">{docs}</pre>}
      {summary && <p className="mt-3 whitespace-pre-wrap text-sm text-text-muted">{summary}</p>}
    </section>
  );
}
