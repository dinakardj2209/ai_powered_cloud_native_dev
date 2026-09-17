# DevFlow Architecture

## System Overview

DevFlow is a monorepo-based full-stack application designed as an AI-powered developer platform. The architecture prioritizes clean separation of concerns, type safety across the stack, and incremental feature delivery across 5 phases.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  React 19 + TypeScript + Tailwind CSS + TanStack Query      │
│  Port: 5173                                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         API LAYER                            │
│  Node.js + Express + TypeScript                              │
│  Port: 4000                                                  │
│                                                              │
│  Middleware Stack:                                           │
│  Helmet → CORS → JSON Parser → Pino Logger → Rate Limiter   │
│  → Auth → RBAC → Validation → Route Handler → Error Handler │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│     MongoDB      │          │      Redis        │
│  Primary data    │          │  Refresh tokens   │
│  Users, Projects │          │  Response cache   │
│  Tasks           │          │  Session store    │
└──────────────────┘          └──────────────────┘
```

## Module Architecture (Backend)

Each feature follows a consistent module pattern:

```
modules/
└── auth/
    ├── auth.routes.ts      # Route definitions + middleware chain
    ├── auth.controller.ts  # Request/response handling (thin)
    └── auth.service.ts     # Business logic (fat)
```

**Why this pattern?**
- **Routes** define the HTTP interface and attach middleware
- **Controllers** are thin — they parse input and format output
- **Services** contain all business logic, making them testable in isolation

## Authentication Flow

```
1. User submits credentials
2. Server validates → bcrypt.compare()
3. Server generates:
   - Access Token (JWT, 15min, contains userId + role)
   - Refresh Token (JWT, 7 days, contains userId only)
4. Refresh token stored in Redis with TTL
5. Client stores both tokens in localStorage
6. Client sends Access Token in Authorization header
7. On 401 → Client auto-refreshes using Refresh Token
8. On logout → Refresh token deleted from Redis
```

## RBAC Model

```
ADMIN
 ├── users:manage
 ├── projects:manage
 ├── tasks:manage
 ├── deploy:manage
 └── settings:manage

DEVELOPER
 ├── projects:read/write
 ├── tasks:read/write
 ├── ai:use
 └── deploy:trigger

VIEWER
 ├── projects:read
 ├── tasks:read
 └── monitoring:read
```

Permissions are checked via `requirePermission()` middleware, not hardcoded role checks in controllers.

## Data Models

### User
- email (unique), passwordHash, name, role, githubUsername

### Project
- name, description, techStack, status, ownerId
- members[] (userId, role, joinedAt)
- githubRepoUrl, githubRepoName (Phase 2)

### Task
- projectId, title, description, status, priority
- assigneeId, createdById, tags[]

## Caching Strategy (Redis)

| Key Pattern | TTL | Purpose |
|-------------|-----|---------|
| `refresh:{userId}:{token}` | 7 days | Refresh token validity |
| `projects:{userId}:{page}:{limit}` | 5 min | Project list cache |
| `project:{projectId}` | 5 min | Single project cache |

Cache invalidation happens on write operations (update/delete).

## Phase 2+ Architecture (Planned)

### GitHub Integration
```
GitHub OAuth → Store access token (encrypted)
GitHub Webhooks → /api/webhooks/github
GitHub API Service → repos, commits, PRs, issues
```

### AI Service (Provider Abstraction)
```
AIProvider Interface
 ├── OpenAIProvider (Phase 3)
 ├── GeminiProvider (future)
 └── AnthropicProvider (future)

Context Builder → Project + Repo + Tasks → RAG Pipeline
```

### Real-time (Phase 2)
```
Socket.io server attached to Express
Events: notification, activity, chat
Redis Pub/Sub for multi-instance scaling
```

### CI/CD (Phase 4)
```
GitHub Actions → lint → test → build → Docker image
DevFlow Dashboard → polls GitHub Actions API for status
```

### AWS Deployment (Phase 5)
```
CloudFront → S3 (static) + ALB → ECS Fargate (API)
CloudWatch → metrics + logs
Secrets Manager → production credentials
```

## Error Handling

All errors follow a consistent response format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable message",
    "code": "MACHINE_READABLE_CODE",
    "details": {}
  }
}
```

Operational errors (AppError) return appropriate HTTP status codes.
Unexpected errors are logged via Pino and return 500 in production.

## Security Measures (Phase 1)

- Password hashing with bcrypt (12 rounds)
- JWT with separate access/refresh secrets
- Helmet security headers
- CORS restricted to frontend origin
- Rate limiting (global: 100/15min, auth: 10/15min)
- Input validation with Zod on all endpoints
- RBAC on all protected routes
- Refresh token revocation via Redis

## Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| API unit | Jest | Services, utilities |
| API integration | Jest + Supertest | Route handlers |
| Frontend | Playwright (Phase 4) | E2E flows |
| CI | GitHub Actions | Lint + build + test on every push |
