/**
 * DevFlow Database Seed Script
 *
 * Creates demo users, the "Food Delivery Platform" project,
 * and realistic tasks for development and demo purposes.
 *
 * Run: npm run seed
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import {
  UserRole,
  TaskStatus,
  ProjectTechStack,
  ProjectStatus,
} from '@devflow/shared';
import { User } from '../modules/users/user.model';
import { Project } from '../modules/projects/project.model';
import { Task } from '../modules/tasks/task.model';
import { Deployment } from '../modules/deployments/deployment.model';
import { Notification } from '../modules/notifications/notification.model';
import { Sprint } from '../modules/sprints/sprint.model';
import { ChatMessage } from '../modules/chat/chat.model';
import { Activity } from '../modules/activity/activity.model';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/devflow';

const DEMO_USERS = [
  {
    email: 'admin@devflow.dev',
    password: 'Admin@123',
    name: 'Dinakar Admin',
    role: UserRole.ADMIN,
    githubUsername: 'dinakar-admin',
  },
  {
    email: 'dev@devflow.dev',
    password: 'Dev@12345',
    name: 'Dinakar Developer',
    role: UserRole.DEVELOPER,
    githubUsername: 'dinakar-dev',
  },
  {
    email: 'viewer@devflow.dev',
    password: 'Viewer@123',
    name: 'Alex Viewer',
    role: UserRole.VIEWER,
    githubUsername: 'alex-viewer',
  },
];

const DEMO_TASKS = [
  {
    title: 'Create user authentication',
    description:
      'Implement JWT-based authentication with login, register, and protected routes. Include password hashing with bcrypt and refresh token rotation.',
    status: TaskStatus.DONE,
    priority: 'HIGH' as const,
    tags: ['auth', 'backend', 'security'],
  },
  {
    title: 'Create restaurant API',
    description:
      'Build REST endpoints for restaurant CRUD operations. Include geolocation filtering, operating hours, and menu associations.',
    status: TaskStatus.IN_PROGRESS,
    priority: 'HIGH' as const,
    tags: ['api', 'backend', 'restaurants'],
  },
  {
    title: 'Implement food ordering',
    description:
      'Create order placement flow with cart management, order status tracking, and real-time order updates via WebSockets.',
    status: TaskStatus.IN_PROGRESS,
    priority: 'CRITICAL' as const,
    tags: ['orders', 'frontend', 'websockets'],
  },
  {
    title: 'Add payment integration',
    description:
      'Integrate Stripe payment gateway for order checkout. Handle webhooks for payment confirmation and refund flows.',
    status: TaskStatus.TODO,
    priority: 'HIGH' as const,
    tags: ['payments', 'stripe', 'integration'],
  },
  {
    title: 'Build restaurant dashboard',
    description:
      'Create a dashboard for restaurant owners to manage menus, view orders, and update availability.',
    status: TaskStatus.REVIEW,
    priority: 'MEDIUM' as const,
    tags: ['frontend', 'dashboard'],
  },
  {
    title: 'Add delivery tracking map',
    description:
      'Integrate Google Maps API for real-time delivery tracking with driver location updates.',
    status: TaskStatus.TODO,
    priority: 'MEDIUM' as const,
    tags: ['maps', 'frontend', 'tracking'],
  },
  {
    title: 'Write API integration tests',
    description:
      'Add Jest + Supertest integration tests for all auth and order endpoints with 80%+ coverage.',
    status: TaskStatus.REVIEW,
    priority: 'MEDIUM' as const,
    tags: ['testing', 'quality'],
  },
  {
    title: 'Implement rate limiting',
    description:
      'Add express-rate-limit middleware to auth and order endpoints to prevent abuse.',
    status: TaskStatus.DONE,
    priority: 'LOW' as const,
    tags: ['security', 'backend'],
  },
];

async function seed() {
  console.log('🌱 Starting DevFlow seed...\n');

  await mongoose.connect(MONGODB_URI);
  console.log('✓ Connected to MongoDB\n');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Deployment.deleteMany({}),
    Notification.deleteMany({}),
    Sprint.deleteMany({}),
    ChatMessage.deleteMany({}),
    Activity.deleteMany({}),
  ]);
  console.log('✓ Cleared existing data\n');

  // Create users
  const createdUsers = [];
  for (const userData of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    const user = await User.create({
      email: userData.email,
      passwordHash,
      name: userData.name,
      role: userData.role,
      githubUsername: userData.githubUsername,
    });
    createdUsers.push(user);
    console.log(`  ✓ User: ${userData.email} (${userData.role})`);
  }

  const [admin, developer, viewer] = createdUsers;

  // Create Food Delivery Platform project
  const project = await Project.create({
    name: 'Food Delivery Platform',
    description:
      'A full-stack MERN food delivery application with real-time order tracking, restaurant management, payment integration, and delivery driver assignment. Built as the flagship demo project for DevFlow.',
    techStack: ProjectTechStack.MERN,
    status: ProjectStatus.ACTIVE,
    ownerId: admin._id,
    githubRepoUrl: 'https://github.com/dinakar-dev/food-delivery-app',
    githubRepoName: 'food-delivery-app',
    members: [
      { userId: admin._id, role: UserRole.ADMIN, joinedAt: new Date() },
      { userId: developer._id, role: UserRole.DEVELOPER, joinedAt: new Date() },
      { userId: viewer._id, role: UserRole.VIEWER, joinedAt: new Date() },
    ],
  });

  console.log(`\n  ✓ Project: ${project.name}`);

  // Create tasks with assignments
  const assignees = [developer._id, developer._id, admin._id, developer._id];

  for (let i = 0; i < DEMO_TASKS.length; i++) {
    const taskData = DEMO_TASKS[i];
    await Task.create({
      ...taskData,
      projectId: project._id,
      assigneeId: assignees[i % assignees.length],
      createdById: admin._id,
    });
    console.log(`  ✓ Task: ${taskData.title} [${taskData.status}]`);
  }

  await Sprint.create({
    projectId: project._id,
    name: 'Sprint 4 — Auth & Ordering',
    goal: 'Ship JWT auth, restaurant APIs, and a first-cut order flow.',
    status: 'ACTIVE',
    startDate: new Date(Date.now() - 5 * 86400000),
    endDate: new Date(Date.now() + 9 * 86400000),
  });

  const pipelineSteps = [
    { name: 'Dependencies installed', status: 'success', durationMs: 11800 },
    { name: 'Unit tests', status: 'success', durationMs: 9200 },
    { name: 'ESLint', status: 'success', durationMs: 2800 },
    { name: 'Build', status: 'success', durationMs: 16400 },
    { name: 'Docker build', status: 'success', durationMs: 24100 },
    { name: 'Deployment', status: 'success', durationMs: 17300 },
  ];

  await Deployment.create({
    projectId: project._id,
    number: 142,
    status: 'SUCCESS',
    commitSha: 'a1b2c3d',
    commitMessage: 'Implemented JWT authentication',
    branch: 'feature/authentication',
    environment: 'production',
    triggeredBy: 'Dinakar Developer',
    steps: pipelineSteps,
    startedAt: new Date(Date.now() - 120000),
    finishedAt: new Date(),
    url: 'https://food.devflow.dev',
  });

  await Deployment.create({
    projectId: project._id,
    number: 141,
    status: 'SUCCESS',
    commitSha: 'c4d8821',
    commitMessage: 'Harden login rate limiting and password hashing',
    branch: 'main',
    environment: 'production',
    triggeredBy: 'Dinakar Admin',
    steps: pipelineSteps,
    startedAt: new Date(Date.now() - 86400000),
    finishedAt: new Date(Date.now() - 86000000),
  });

  await Notification.insertMany([
    {
      userId: developer._id,
      type: 'deploy',
      title: 'BUILD #142 succeeded',
      body: 'Tests, lint, Docker image, and AWS ECS deploy completed.',
      projectId: project._id,
    },
    {
      userId: developer._id,
      type: 'github',
      title: 'PR #42 opened',
      body: 'JWT authentication and refresh tokens is ready for review.',
      projectId: project._id,
    },
    {
      userId: admin._id,
      type: 'ai',
      title: 'Latency insight',
      body: '/api/orders p95 increased. Suggested: index userId and cache menus.',
      projectId: project._id,
    },
  ]);

  await ChatMessage.create({
    projectId: project._id,
    userId: admin._id,
    userName: admin.name,
    content: 'Sprint 4 kickoff: auth is done, restaurant API is in review, payments next.',
  });

  await Activity.insertMany([
    {
      projectId: project._id,
      userId: developer._id,
      userName: developer.name,
      action: 'pushed a commit',
      detail: 'Implemented JWT authentication',
    },
    {
      projectId: project._id,
      userId: admin._id,
      userName: admin.name,
      action: 'deployed',
      detail: 'BUILD #142 → production',
    },
    {
      projectId: project._id,
      userId: developer._id,
      userName: developer.name,
      action: 'opened a pull request',
      detail: 'PR #42 JWT authentication',
    },
  ]);

  console.log('\n  ✓ Sprint, deployments, notifications, chat, and activity seeded');

  console.log('\n✅ Seed completed successfully!\n');
  console.log('Demo credentials:');
  console.log('  Admin:     admin@devflow.dev  / Admin@123');
  console.log('  Developer: dev@devflow.dev    / Dev@12345');
  console.log('  Viewer:    viewer@devflow.dev / Viewer@123');
  console.log('');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
