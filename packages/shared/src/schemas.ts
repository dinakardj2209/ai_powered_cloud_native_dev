import { z } from 'zod';
import { UserRole, TaskStatus, ProjectTechStack, ProjectStatus } from './constants';

/** Auth validation schemas */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/** Project validation schemas */
export const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional().default(''),
  techStack: z.nativeEnum(ProjectTechStack).default(ProjectTechStack.MERN),
  githubRepoUrl: z.string().url().optional(),
  githubRepoName: z.string().max(200).optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.nativeEnum(ProjectStatus).optional(),
});

/** Task validation schemas */
export const createTaskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().default(''),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  assigneeId: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

export const updateTaskSchema = createTaskSchema.partial();

/** Pagination query schema */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const aiChatSchema = z.object({
  message: z.string().min(1).max(4000),
});

export const aiCodeReviewSchema = z.object({
  code: z.string().min(1).max(20000),
  language: z.string().max(40).optional().default('javascript'),
});

export const aiGenerateTasksSchema = z.object({
  prompt: z.string().min(4).max(2000),
});

export const aiPrSummarySchema = z.object({
  title: z.string().min(2).max(200),
  diff: z.string().max(20000).optional().default(''),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole).default(UserRole.DEVELOPER),
});

export const chatMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const createSprintSchema = z.object({
  name: z.string().min(2).max(80),
  goal: z.string().max(400).optional().default(''),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type AiChatInput = z.infer<typeof aiChatSchema>;
export type AiCodeReviewInput = z.infer<typeof aiCodeReviewSchema>;
export type AiGenerateTasksInput = z.infer<typeof aiGenerateTasksSchema>;
export type AiPrSummaryInput = z.infer<typeof aiPrSummarySchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type CreateSprintInput = z.infer<typeof createSprintSchema>;
