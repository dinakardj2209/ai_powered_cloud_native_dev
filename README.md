# DevFlow — AI-Powered Cloud-Native Developer Platform

DevFlow is a Linear-style workspace that brings **project management, GitHub activity, project-aware AI, CI/CD visibility, and cloud monitoring** into one product.

**Resume one-liner:** a full-stack TypeScript platform with JWT + refresh tokens, RBAC, Redis caching, WebSockets, GitHub OAuth/webhooks, OpenAI-backed reviews, Docker, and GitHub Actions.

## Architecture

```
React (Vite + Tailwind)  →  Express REST + Socket.io
                               │
                    ┌──────────┼──────────┐
                    MongoDB   Redis      S3 (prod)
                               │
                         AI (OpenAI + fallbacks)
                         GitHub API + Actions
                         AWS ECS / CloudWatch (prod)
```

## Quick start

```bash
cp .env.example .env
npm install
npm run docker:up          # MongoDB + Redis
npm run seed               # Food Delivery Platform demo
npm run dev                # API :4000 + web :5173
```

Open [http://localhost:5173](http://localhost:5173)

| Role | Email | Password |
| --- | --- | --- |
| ADMIN | `admin@devflow.dev` | `Admin@123` |
| DEVELOPER | `dev@devflow.dev` | `Dev@12345` |
| VIEWER | `viewer@devflow.dev` | `Viewer@123` |

## What you can demo

1. **Auth** — register/login, JWT access (15m), Redis refresh rotation, optional GitHub OAuth, Helmet + rate limits + Zod.
2. **Projects & tasks** — Food Delivery Platform board: TODO → IN PROGRESS → REVIEW → DONE.
3. **GitHub** — commits, PRs, issues, CI check badges (live with `GITHUB_TOKEN`, seeded otherwise) + webhook inbox.
4. **AI** — project-aware chat, code review scores, Google Auth epic generation, docs/PR summaries. Works **without** an API key via high-quality fallbacks.
5. **CI/CD** — BUILD #142 pipeline UI; trigger a new deploy from the dashboard.
6. **Monitoring** — health, latency, Redis before/after cache story, AI root-cause hints.
7. **Realtime** — notifications, team chat, activity via Socket.io.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | API + web together |
| `npm test` | Jest (AI + RBAC) + frontend typecheck |
| `npm run build` | Shared + API + web |
| `npm run docker:up` | Mongo + Redis |
| `docker compose --profile full up --build` | Full containerized stack |

## Production notes

- See `infra/aws.md` for S3, CloudFront, ECS, IAM, Secrets Manager, CloudWatch.
- See `infra/github-actions/app-pipeline.yml` for the install → test → lint → build → Docker → deploy story.
- Platform CI lives in `.github/workflows/ci.yml`.

## Stack

React 19 · TypeScript · Tailwind 4 · TanStack Query · Node 20 · Express · MongoDB · Redis · Socket.io · Zod · Jest · Docker · GitHub Actions
