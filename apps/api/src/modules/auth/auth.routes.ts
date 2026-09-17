import { Router } from 'express';
import { registerSchema, loginSchema, refreshTokenSchema } from '@devflow/shared';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authRateLimiter } from '../../middleware/rateLimit.middleware';
import * as authController from './auth.controller';

const router = Router();

router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    res.json({ success: true, data: { configured: false, authorizeUrl: null } });
    return;
  }
  authController.githubStart(req, res, next);
});
router.get('/github/callback', authController.githubCallback);

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
