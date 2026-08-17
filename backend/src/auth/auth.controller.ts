import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation.js';
import { env } from '../config/env.js';

const COOKIE_NAME = 'surajai_refresh';

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth',
  });
};

const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = registerSchema.parse(req.body);
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    const { user, tokens } = await AuthService.register(validated, userAgent, ipAddress);

    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    const { user, tokens } = await AuthService.login(validated, userAgent, ipAddress);

    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies[COOKIE_NAME] || req.body.refreshToken;

    const tokens = await AuthService.refreshToken(refreshToken);

    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    clearRefreshTokenCookie(res);
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies[COOKIE_NAME] || req.body.refreshToken;

    await AuthService.logout(refreshToken);
    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      data: {
        message: 'Successfully logged out.',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const user = await AuthService.getCurrentUser(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    }

    const validated = changePasswordSchema.parse(req.body);
    await AuthService.changePassword(req.user.id, validated);
    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      data: {
        message: 'Password successfully changed. Please log in with your new password.',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = forgotPasswordSchema.parse(req.body);
    const result = await AuthService.forgotPassword(validated.email);

    res.status(200).json({
      success: true,
      data: {
        message: 'If an account with that email exists, password reset instructions have been created.',
        ...(env.NODE_ENV === 'development' && result.token ? { resetToken: result.token } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = resetPasswordSchema.parse(req.body);
    await AuthService.resetPassword(validated.token, validated.password);
    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      data: {
        message: 'Password successfully reset. You may now log in.',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential, idToken } = req.body;
    const token = credential || idToken;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Google OAuth credential token is required' },
      });
    }

    const { user, tokens } = await AuthService.googleLogin(
      token,
      req.headers['user-agent'],
      req.ip
    );

    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email is required' },
      });
    }

    const sent = await AuthService.sendVerificationOtp(email);

    res.status(200).json({
      success: true,
      data: {
        message: sent ? 'Verification code sent to your email.' : 'Email sending skipped (SMTP unconfigured).',
        email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email and 6-digit OTP code are required' },
      });
    }

    const { user, tokens } = await AuthService.verifyOtp(
      email,
      otp,
      req.headers['user-agent'],
      req.ip
    );

    setRefreshTokenCookie(res, tokens.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};
