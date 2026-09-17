/** Application-wide role definitions for RBAC */
export enum UserRole {
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
  VIEWER = 'VIEWER',
}

/** Kanban-style task workflow statuses */
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

/** Supported project technology stacks */
export enum ProjectTechStack {
  MERN = 'MERN',
  MEAN = 'MEAN',
  REACT_NODE = 'REACT_NODE',
  NEXTJS = 'NEXTJS',
  OTHER = 'OTHER',
}

/** Project visibility */
export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

/** Sprint status for future sprint module */
export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

/** AI provider identifiers — used by the provider abstraction layer */
export enum AIProvider {
  OPENAI = 'openai',
  GEMINI = 'gemini',
  ANTHROPIC = 'anthropic',
}

/** Permission actions mapped to roles */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'users:manage',
    'projects:manage',
    'projects:read',
    'projects:write',
    'tasks:manage',
    'tasks:read',
    'tasks:write',
    'ai:use',
    'deploy:manage',
    'deploy:trigger',
    'settings:manage',
    'monitoring:read',
  ],
  [UserRole.DEVELOPER]: [
    'projects:read',
    'projects:write',
    'tasks:read',
    'tasks:write',
    'ai:use',
    'deploy:trigger',
    'monitoring:read',
  ],
  [UserRole.VIEWER]: ['projects:read', 'tasks:read', 'monitoring:read'],
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.DONE,
];
