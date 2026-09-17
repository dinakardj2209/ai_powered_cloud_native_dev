import crypto from 'crypto';
import { Request, Response } from 'express';
import { registerSchema, loginSchema, refreshTokenSchema } from '@devflow/shared';
import { asyncHandler } from '../../utils/asyncHandler';
import * as authService from './auth.service';
import { env } from '../../config/env';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);

  res.status(201).json({
    success: true,
    data: result,
    message: 'Account created successfully',
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);

  res.json({
    success: true,
    data: result,
    message: 'Logged in successfully',
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = refreshTokenSchema.parse(req.body);
  const result = await authService.refreshAccessToken(refreshToken);

  res.json({
    success: true,
    data: result,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  await authService.logout(req.user!.userId, refreshToken);

  res.json({
    success: true,
    data: null,
    message: 'Logged out successfully',
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.userId);

  res.json({
    success: true,
    data: user,
  });
});

export const githubStart = asyncHandler(async (_req: Request, res: Response) => {
  const state = crypto.randomBytes(16).toString('hex');
  const authorizeUrl = authService.githubAuthorizeUrl(state);
  res.json({ success: true, data: { configured: true, authorizeUrl, state } });
});

export const githubCallback = asyncHandler(async (req: Request, res: Response) => {
  const code = String(req.query.code ?? '');
  if (!code) {
    res.redirect(`${env.frontendUrl}/login?error=github`);
    return;
  }
  const result = await authService.loginWithGitHub(code);
  const params = new URLSearchParams({
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
  });
  res.redirect(`${env.frontendUrl}/auth/callback?${params.toString()}`);
});
