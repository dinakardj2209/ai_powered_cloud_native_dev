import { generateTaskPlan, monitoringInsight, reviewCode } from '../src/services/ai.service';
import { ROLE_PERMISSIONS, UserRole } from '@devflow/shared';

describe('AI task generation', () => {
  it('creates a Google Auth epic from natural language', () => {
    const plan = generateTaskPlan('I want to add Google authentication.');
    expect(plan.epic).toBe('Google Authentication');
    expect(plan.tasks.length).toBeGreaterThanOrEqual(6);
    expect(plan.tasks[0].title).toMatch(/OAuth/i);
  });

  it('falls back to a generic epic', () => {
    const plan = generateTaskPlan('I want to add delivery tracking');
    expect(plan.epic.toLowerCase()).toContain('delivery tracking');
    expect(plan.tasks.some((t) => t.tags.includes('backend'))).toBe(true);
  });
});

describe('AI code review', () => {
  it('flags unauthenticated user lookups', async () => {
    const code = `app.get("/users/:id", async (req, res) => {
      const user = await User.findById(req.params.id);
      res.json(user);
    });`;
    const result = await reviewCode(code, 'javascript');
    expect(result.security).toBeLessThan(80);
    expect(result.issues.some((i) => /authentication/i.test(i.title))).toBe(true);
  });
});

describe('Monitoring insight', () => {
  it('recommends query and cache work when latency spikes', () => {
    const insight = monitoringInsight(1800);
    expect(insight.severity).toBe('warning');
    expect(insight.suggestedActions.some((a) => /index/i.test(a))).toBe(true);
  });
});

describe('RBAC', () => {
  it('denies AI and deploy to viewers', () => {
    expect(ROLE_PERMISSIONS[UserRole.VIEWER]).not.toContain('ai:use');
    expect(ROLE_PERMISSIONS[UserRole.VIEWER]).not.toContain('deploy:trigger');
  });

  it('allows developers to use AI and trigger deploys', () => {
    expect(ROLE_PERMISSIONS[UserRole.DEVELOPER]).toContain('ai:use');
    expect(ROLE_PERMISSIONS[UserRole.DEVELOPER]).toContain('deploy:trigger');
  });
});
