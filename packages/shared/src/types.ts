import { UserRole, TaskStatus, ProjectTechStack, ProjectStatus } from './constants';

/** Public user profile returned by the API (no password hash) */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  githubUsername?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface ProjectMember {
  userId: string;
  role: UserRole;
  joinedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: ProjectTechStack;
  status: ProjectStatus;
  ownerId: string;
  members: ProjectMember[];
  githubRepoUrl?: string;
  githubRepoName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeId?: string;
  createdById: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    api: boolean;
    mongodb: boolean;
    redis: boolean;
  };
  uptime: number;
}

export interface GitCommit {
  sha: string;
  message: string;
  author: string;
  authorEmail: string;
  branch: string;
  committedAt: string;
  url: string;
  checks: {
    build: 'passed' | 'failed' | 'pending';
    tests: 'passed' | 'failed' | 'pending';
    security: 'passed' | 'failed' | 'pending';
  };
}

export interface GitPullRequest {
  number: number;
  title: string;
  author: string;
  state: 'open' | 'merged' | 'closed';
  sourceBranch: string;
  targetBranch: string;
  createdAt: string;
  url: string;
}

export interface GitIssue {
  number: number;
  title: string;
  state: 'open' | 'closed';
  labels: string[];
  createdAt: string;
}

export interface RepositorySnapshot {
  connected: boolean;
  name: string;
  url: string;
  defaultBranch: string;
  branches: string[];
  commits: GitCommit[];
  pullRequests: GitPullRequest[];
  issues: GitIssue[];
}

export interface PipelineStep {
  name: string;
  status: 'success' | 'failed' | 'running' | 'pending' | 'skipped';
  durationMs: number;
}

export interface Deployment {
  id: string;
  projectId: string;
  number: number;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'CANCELLED';
  commitSha: string;
  commitMessage: string;
  branch: string;
  environment: 'production' | 'staging';
  triggeredBy: string;
  steps: PipelineStep[];
  startedAt: string;
  finishedAt?: string;
  url?: string;
}

export interface MonitoringMetrics {
  apiStatus: 'healthy' | 'degraded' | 'unhealthy';
  database: 'connected' | 'disconnected';
  cpuPercent: number;
  memoryPercent: number;
  requestsPerMin: number;
  errorRate: number;
  responseTimeMs: number;
  cacheHitRate: number;
  uncachedLatencyMs: number;
  cachedLatencyMs: number;
}

export interface MonitoringError {
  status: number;
  method: string;
  path: string;
  occurrences: number;
  lastSeen: string;
  message: string;
}

export interface AiInsight {
  title: string;
  summary: string;
  severity: 'info' | 'warning' | 'critical';
  suggestedActions: string[];
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface CodeReviewResult {
  quality: number;
  security: number;
  performance: number;
  maintainability: number;
  issues: Array<{
    severity: 'warning' | 'error' | 'info';
    title: string;
    detail: string;
  }>;
  suggestion: string;
}

export interface GeneratedTaskPlan {
  epic: string;
  tasks: Array<{
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    tags: string[];
  }>;
}

export interface NotificationItem {
  id: string;
  type: 'task' | 'deploy' | 'github' | 'ai' | 'system';
  title: string;
  body: string;
  read: boolean;
  projectId?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  projectId: string;
  userName: string;
  action: string;
  detail: string;
  createdAt: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  startDate: string;
  endDate: string;
}

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  githubUsername?: string;
  joinedAt: string;
}
