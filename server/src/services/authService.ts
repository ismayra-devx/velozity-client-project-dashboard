import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { AppError } from '../middlewares/errorMiddleware.js';
import { AuthUser } from '../types/index.js';
import { LoginInput, isPersonalEmail } from '../validators/authValidator.js';

export function signAccessToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    config.jwt.accessSecret,
    { expiresIn: '15m' }
  );
}

export function signRefreshToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.refreshSecret,
    { expiresIn: '7d' }
  );
}

export async function loginUser(input: LoginInput) {
  if (isPersonalEmail(input.email)) {
    throw new AppError(
      'Personal email addresses (e.g. @gmail.com, @yahoo.com) are not permitted. Please sign in with your corporate agency work email address.',
      400
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const accessToken = signAccessToken(authUser);
  const refreshToken = signRefreshToken(authUser);

  // Store refresh token in database for rotation & revocation tracking
  const expiresAt = new Date(Date.now() + config.jwt.refreshExpiryMs);
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    user: authUser,
    accessToken,
    refreshToken,
  };
}

export async function refreshAccessToken(oldRefreshToken: string) {
  if (!oldRefreshToken) {
    throw new AppError('Refresh token required', 401);
  }

  // Find token record in database
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: oldRefreshToken },
    include: { user: true },
  });

  if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  try {
    jwt.verify(oldRefreshToken, config.jwt.refreshSecret);
  } catch {
    throw new AppError('Invalid refresh token signature', 401);
  }

  const authUser: AuthUser = {
    id: tokenRecord.user.id,
    email: tokenRecord.user.email,
    name: tokenRecord.user.name,
    role: tokenRecord.user.role,
  };

  // Revoke old refresh token (token rotation)
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { revoked: true },
  });

  // Generate new pair
  const newAccessToken = signAccessToken(authUser);
  const newRefreshToken = signRefreshToken(authUser);

  const expiresAt = new Date(Date.now() + config.jwt.refreshExpiryMs);
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: authUser.id,
      expiresAt,
    },
  });

  return {
    user: authUser,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(refreshToken?: string) {
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }
  return { success: true };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}
