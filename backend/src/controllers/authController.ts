import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import * as authService from '../services/authService.js';

const COOKIE_NAME = 'refreshToken';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

    // Set refresh token in HttpOnly cookie
    res.cookie(COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: config.jwt.refreshExpiryMs,
    });

    res.status(200).json({
      success: true,
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies[COOKIE_NAME];
    const { user, accessToken, refreshToken: newRefreshToken } = await authService.refreshAccessToken(refreshToken);

    // Rotate refresh token cookie
    res.cookie(COOKIE_NAME, newRefreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: config.jwt.refreshExpiryMs,
    });

    res.status(200).json({
      success: true,
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies[COOKIE_NAME];
    await authService.logoutUser(refreshToken);

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/api/auth',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getCurrentUser(req.user!.id);
    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
