import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as authRepo from '../features/auth/auth.repository.js';

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'basma-api',
    audience: 'basma-client',
  });
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const saveRefreshToken = async (userId, token, req) => {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await authRepo.insertRefreshToken({
    userId,
    tokenHash,
    expiresAt,
    ipAddress: req?.ip || null,
    userAgent: req?.headers?.['user-agent'] || null,
  });

  return token;
};

export const verifyRefreshToken = async (token) => {
  const tokenHash = hashToken(token);
  const activeToken = await authRepo.fetchActiveRefreshToken(tokenHash);

  if (!activeToken) {
    throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
  }

  return activeToken;
};

export const revokeRefreshToken = async (token) => {
  const tokenHash = hashToken(token);
  await authRepo.revokeRefreshToken(tokenHash);
};

export const revokeAllUserTokens = async (userId) => {
  await authRepo.revokeAllUserTokens(userId);
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'basma-api',
    audience: 'basma-client',
  });
};
