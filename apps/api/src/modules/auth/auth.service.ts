import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RegisterInput, LoginInput, AuthResponse, UserRole } from '@devflow/shared';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { User } from '../users/user.model';
import { toUserProfile } from '../users/user.mapper';
import { JwtPayload } from '../../middleware/auth.middleware';
import {
  storeRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
  revokeAllRefreshTokens,
} from '../../services/redis.service';

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function parseExpiresInToSeconds(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 900;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 900;
  }
}

function generateTokens(payload: JwtPayload) {
  const accessToken = jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });

  const refreshToken = jwt.sign({ userId: payload.userId }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existingUser = await User.findOne({ email: input.email });
  if (existingUser) {
    throw AppError.conflict('Email already registered', 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await User.create({
    email: input.email,
    passwordHash,
    name: input.name,
  });

  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const tokens = generateTokens(payload);
  await storeRefreshToken(payload.userId, tokens.refreshToken, REFRESH_TOKEN_TTL_SECONDS);

  return {
    user: toUserProfile(user),
    tokens,
  };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user) {
    throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const tokens = generateTokens(payload);
  await storeRefreshToken(payload.userId, tokens.refreshToken, REFRESH_TOKEN_TTL_SECONDS);

  return {
    user: toUserProfile(user),
    tokens,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  let decoded: { userId: string };

  try {
    decoded = jwt.verify(refreshToken, env.jwt.refreshSecret) as { userId: string };
  } catch {
    throw AppError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const isValid = await isRefreshTokenValid(decoded.userId, refreshToken);
  if (!isValid) {
    throw AppError.unauthorized('Refresh token revoked or expired', 'REFRESH_TOKEN_REVOKED');
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw AppError.unauthorized('User not found', 'USER_NOT_FOUND');
  }

  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });

  return { accessToken };
}

export async function logout(userId: string, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    await revokeRefreshToken(userId, refreshToken);
  } else {
    await revokeAllRefreshTokens(userId);
  }
}

export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found');
  }
  return toUserProfile(user);
}

export function githubAuthorizeUrl(state: string): string {
  if (!env.github.clientId) {
    throw AppError.badRequest('GitHub OAuth is not configured', 'GITHUB_NOT_CONFIGURED');
  }
  const params = new URLSearchParams({
    client_id: env.github.clientId,
    redirect_uri: env.github.callbackUrl,
    scope: 'read:user user:email repo',
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function loginWithGitHub(code: string): Promise<AuthResponse> {
  if (!env.github.clientId || !env.github.clientSecret) {
    throw AppError.badRequest('GitHub OAuth is not configured', 'GITHUB_NOT_CONFIGURED');
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.github.clientId,
      client_secret: env.github.clientSecret,
      code,
    }),
  });
  const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenJson.access_token) {
    throw AppError.unauthorized('GitHub OAuth failed', 'GITHUB_OAUTH_FAILED');
  }

  const headers = {
    Authorization: `Bearer ${tokenJson.access_token}`,
    'User-Agent': 'DevFlow',
    Accept: 'application/vnd.github+json',
  };

  const userRes = await fetch('https://api.github.com/user', { headers });
  const gh = (await userRes.json()) as {
    id: number;
    login: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };

  let email = gh.email;
  if (!email) {
    const emailsRes = await fetch('https://api.github.com/user/emails', { headers });
    const emails = (await emailsRes.json()) as Array<{ email: string; primary: boolean }>;
    if (Array.isArray(emails)) {
      email = emails.find((e) => e.primary)?.email ?? emails[0]?.email;
    }
  }
  if (!email) {
    email = `${gh.login}@users.noreply.github.com`;
  }

  let user = await User.findOne({ $or: [{ githubId: String(gh.id) }, { email }] }).select('+passwordHash');
  if (!user) {
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
    user = await User.create({
      email,
      passwordHash,
      name: gh.name || gh.login,
      githubId: String(gh.id),
      githubUsername: gh.login,
      avatarUrl: gh.avatar_url,
      role: UserRole.DEVELOPER,
    });
  } else {
    user.githubId = String(gh.id);
    user.githubUsername = gh.login;
    if (gh.avatar_url) user.avatarUrl = gh.avatar_url;
    await user.save();
  }

  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  const tokens = generateTokens(payload);
  await storeRefreshToken(payload.userId, tokens.refreshToken, REFRESH_TOKEN_TTL_SECONDS);

  return { user: toUserProfile(user), tokens };
}
