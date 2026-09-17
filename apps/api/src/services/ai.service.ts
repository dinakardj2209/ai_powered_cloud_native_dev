import { env } from '../config/env';
import { Task } from '../modules/tasks/task.model';
import { Project } from '../modules/projects/project.model';
import {
  AiChatMessage,
  CodeReviewResult,
  GeneratedTaskPlan,
  AiInsight,
} from '@devflow/shared';

async function callOpenAI(system: string, user: string): Promise<string | null> {
  if (!env.ai.openaiApiKey) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.ai.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function projectContext(projectId: string) {
  const [project, tasks] = await Promise.all([
    Project.findById(projectId),
    Task.find({ projectId }).limit(40),
  ]);
  if (!project) return null;
  const taskLines = tasks
    .map((t) => `- [${t.status}] ${t.title} (${t.priority})`)
    .join('\n');
  return {
    project,
    text: `Project: ${project.name}\nStack: ${project.techStack}\nRepo: ${project.githubRepoName ?? 'n/a'}\nDescription: ${project.description}\nTasks:\n${taskLines}`,
  };
}

export async function chatAboutProject(
  projectId: string,
  userId: string,
  message: string,
): Promise<AiChatMessage> {
  const ctx = await projectContext(projectId);
  const system =
    'You are DevFlow, a project-aware software engineering assistant. Answer using the provided project context. Be concrete and structured.';
  const live = await callOpenAI(system, `${ctx?.text ?? ''}\n\nDeveloper question: ${message}`);

  const content = live ?? fallbackChat(message, ctx?.project.name ?? 'this project');

  return {
    id: `${Date.now()}`,
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
  };
}

function fallbackChat(message: string, projectName: string): string {
  const q = message.toLowerCase();
  if (q.includes('auth')) {
    return [
      `Authentication Flow — ${projectName}`,
      '',
      '1. User submits email/password',
      '2. POST /api/auth/login',
      '3. Server validates credentials (bcrypt)',
      '4. JWT access token generated (15m) + refresh token (7d, Redis)',
      '5. Token returned to client',
      '6. React stores authentication state',
      '7. Protected APIs validate JWT and enforce RBAC (ADMIN / DEVELOPER / VIEWER)',
      '',
      'Related tasks in this workspace: Create user authentication (DONE), rate limiting (DONE).',
    ].join('\n');
  }
  if (q.includes('google')) {
    return [
      'Suggested approach for Google authentication:',
      '1. Configure OAuth credentials in GitHub/Google Cloud',
      '2. Create /api/auth/google and callback endpoints',
      '3. Add Google login button in React',
      '4. Upsert user by googleId, issue DevFlow JWT',
      '5. Protect routes and write auth tests',
    ].join('\n');
  }
  if (q.includes('order')) {
    return [
      'Food ordering flow in this project:',
      '1. Cart persisted client-side then POST /api/orders',
      '2. Validate restaurant availability and menu items',
      '3. Create order document in MongoDB',
      '4. Emit WebSocket updates for status: PLACED → PREPARING → OUT_FOR_DELIVERY',
      '5. Payment webhook confirms PAID',
      '',
      'Watch /api/orders latency — monitoring currently flags N+1 aggregation as a risk.',
    ].join('\n');
  }
  return [
    `Project-aware summary for ${projectName}`,
    '',
    'This is a MERN food-delivery workspace with JWT auth, restaurant APIs, ordering, and payment work in flight.',
    'I used your current task board (TODO → IN PROGRESS → REVIEW → DONE) as context.',
    '',
    'Ask me to explain a flow, review a snippet, or generate an epic from a feature request.',
  ].join('\n');
}

export async function reviewCode(code: string, language: string): Promise<CodeReviewResult> {
  const live = await callOpenAI(
    'You are a senior security-focused code reviewer. Return concise findings.',
    `Language: ${language}\n\n${code}`,
  );

  const unauthenticated = /findById|findOne|res\.json/.test(code) && !/auth|authorize|req\.user/.test(code);
  const noTryCatch = !/try\s*\{/.test(code);
  const usesParams = /req\.params/.test(code);

  return {
    quality: unauthenticated ? 72 : 88,
    security: unauthenticated ? 70 : 90,
    performance: 88,
    maintainability: noTryCatch ? 78 : 85,
    issues: [
      ...(unauthenticated
        ? [
            {
              severity: 'warning' as const,
              title: 'No authentication/authorization check',
              detail: 'This route returns user data without verifying the caller.',
            },
          ]
        : []),
      ...(noTryCatch
        ? [
            {
              severity: 'warning' as const,
              title: 'No error handling',
              detail: 'Unhandled database errors will surface as uncaught exceptions.',
            },
          ]
        : []),
      ...(usesParams
        ? [
            {
              severity: 'info' as const,
              title: 'User enumeration risk',
              detail: 'Direct ID lookups may expose whether a resource exists.',
            },
          ]
        : []),
    ],
    suggestion:
      live ??
      'Add authorization middleware, wrap the query in try/catch, return 404 for missing records, and avoid leaking sensitive fields.',
  };
}

export function generateTaskPlan(prompt: string): GeneratedTaskPlan {
  const feature = prompt.replace(/^i want to /i, '').trim();
  const isOauth = /google|oauth|sso/i.test(prompt);
  if (isOauth) {
    return {
      epic: 'Google Authentication',
      tasks: [
        { title: 'Configure OAuth credentials', description: 'Create Google Cloud OAuth client and store secrets in env/Secrets Manager.', priority: 'HIGH', tags: ['auth', 'config'] },
        { title: 'Create authentication endpoint', description: 'Add GET /api/auth/google to start the OAuth handshake.', priority: 'HIGH', tags: ['auth', 'backend'] },
        { title: 'Add Google login button', description: 'Add a Google sign-in CTA on the DevFlow login page.', priority: 'MEDIUM', tags: ['frontend'] },
        { title: 'Implement callback handling', description: 'Exchange code for profile, upsert user, set JWT cookies/tokens.', priority: 'HIGH', tags: ['auth'] },
        { title: 'Create/update user schema', description: 'Store googleId and avatar on the User model.', priority: 'MEDIUM', tags: ['database'] },
        { title: 'Generate JWT', description: 'Issue access + refresh tokens after successful OAuth.', priority: 'HIGH', tags: ['auth'] },
        { title: 'Add protected routes', description: 'Ensure RBAC still applies to OAuth users.', priority: 'MEDIUM', tags: ['security'] },
        { title: 'Write authentication tests', description: 'Cover callback success, unknown user, and invalid state.', priority: 'MEDIUM', tags: ['testing'] },
      ],
    };
  }
  return {
    epic: feature.slice(0, 60) || 'New Feature',
    tasks: [
      { title: `Clarify requirements for ${feature}`, description: prompt, priority: 'MEDIUM', tags: ['planning'] },
      { title: 'Design API contract', description: 'Define REST endpoints, payloads, and error codes.', priority: 'HIGH', tags: ['api'] },
      { title: 'Implement backend changes', description: 'Models, services, validation, and RBAC.', priority: 'HIGH', tags: ['backend'] },
      { title: 'Build UI flow', description: 'Add dashboard surfaces and empty/error states.', priority: 'HIGH', tags: ['frontend'] },
      { title: 'Add tests and monitoring', description: 'Unit/API tests plus a CloudWatch/health metric.', priority: 'MEDIUM', tags: ['quality'] },
    ],
  };
}

export function monitoringInsight(responseTimeMs: number): AiInsight {
  if (responseTimeMs >= 800) {
    return {
      title: 'Latency regression on /api/orders',
      summary:
        'The /api/orders endpoint has experienced a significant increase in response time. The most likely cause is repeated database queries inside the order aggregation flow.',
      severity: 'warning',
      suggestedActions: [
        'Review MongoDB query on the order aggregation pipeline',
        'Add an index on userId (and restaurantId)',
        'Reduce repeated queries / hydrate in a single aggregation',
        'Enable Redis caching for restaurant menus and order summaries',
      ],
    };
  }
  return {
    title: 'Services operating within SLO',
    summary: 'API, MongoDB, and Redis are healthy. Error rate is within the 1% budget.',
    severity: 'info',
    suggestedActions: ['Keep Redis cache warm for menu endpoints', 'Continue tracing p95 latency in CloudWatch'],
  };
}

export async function generateDocumentation(projectId: string): Promise<string> {
  const ctx = await projectContext(projectId);
  const live = await callOpenAI(
    'Write a concise technical README for the project using the context. Use markdown.',
    ctx?.text ?? 'Unknown project',
  );
  if (live) return live;
  const name = ctx?.project.name ?? 'Project';
  return [
    `# ${name}`,
    '',
    ctx?.project.description ?? '',
    '',
    '## Stack',
    ctx?.project.techStack ?? 'MERN',
    '',
    '## Current board',
    ctx?.text.split('Tasks:')[1]?.trim() ?? '- See the DevFlow task board',
    '',
    '## Architecture',
    'React dashboard → Express API → MongoDB + Redis. Auth uses JWT access tokens and Redis-backed refresh tokens with RBAC (ADMIN / DEVELOPER / VIEWER).',
    '',
    '## Local run',
    '```bash',
    'npm run docker:up && npm run seed && npm run dev',
    '```',
  ].join('\n');
}

export async function summarizePullRequest(title: string, diff: string): Promise<string> {
  const live = await callOpenAI(
    'Summarize this pull request for a busy reviewer. Cover intent, risk, and test plan.',
    `Title: ${title}\n\nDiff:\n${diff || '(no diff provided)'}`,
  );
  if (live) return live;
  return [
    `PR summary: ${title}`,
    '',
    'Intent: Implement or refine a feature aligned with the current sprint.',
    'Risk: Check auth/RBAC on new endpoints and error handling on database calls.',
    'Test plan: API tests for happy path + 401/403, plus a smoke check of the related dashboard tab.',
    diff ? `Changed surface: ${diff.split('\n').length} lines in the provided snippet.` : 'No diff attached — review the branch in GitHub.',
  ].join('\n');
}

export function productivityInsights(taskCounts: Record<string, number>) {
  const done = taskCounts.DONE ?? 0;
  const total = Object.values(taskCounts).reduce((a, b) => a + b, 0) || 1;
  return {
    completionRate: Math.round((done / total) * 100),
    focus: done >= 3 ? 'Strong delivery this sprint — keep REVIEW column moving.' : 'Unblock IN PROGRESS items before adding more TODO work.',
    suggestion: 'Pair AI task generation with a 2-point WIP limit on IN PROGRESS.',
  };
}
