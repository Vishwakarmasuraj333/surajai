import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { TokenService } from './token.service.js';
import { UserResponse, AuthTokens } from './auth.types.js';
import { AppError } from '../middlewares/errorHandler.js';
import { Role } from '@prisma/client';
import { EmailService } from '../services/email/email.service.js';

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  static sanitizeUser(user: any): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static async register(data: { name: string; email: string; password: string }, userAgent?: string, ipAddress?: string): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      const error: AppError = new Error('An account with this email already exists.');
      error.statusCode = 409;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: Role.USER,
      },
    });

    const accessToken = TokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const rawRefreshToken = TokenService.generateRefreshToken();
    const tokenHash = TokenService.hashToken(rawRefreshToken);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokenHash,
        userAgent,
        ipAddress,
        expiresAt: TokenService.getRefreshTokenExpiryDate(),
      },
    });

    return {
      user: this.sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
      },
    };
  }

  static async login(data: { email: string; password: string }, userAgent?: string, ipAddress?: string): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      const error: AppError = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      const error: AppError = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    const accessToken = TokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const rawRefreshToken = TokenService.generateRefreshToken();
    const tokenHash = TokenService.hashToken(rawRefreshToken);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokenHash,
        userAgent,
        ipAddress,
        expiresAt: TokenService.getRefreshTokenExpiryDate(),
      },
    });

    return {
      user: this.sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
      },
    };
  }

  static async refreshToken(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!rawRefreshToken) {
      const error: AppError = new Error('Refresh token is required.');
      error.statusCode = 401;
      error.code = 'REFRESH_TOKEN_REQUIRED';
      throw error;
    }

    const tokenHash = TokenService.hashToken(rawRefreshToken);

    const session = await prisma.session.findFirst({
      where: { refreshToken: tokenHash },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      const error: AppError = new Error('Invalid or expired refresh token session.');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }

    // Refresh Token Rotation
    await prisma.session.delete({ where: { id: session.id } });

    const newAccessToken = TokenService.generateAccessToken({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    const newRawRefreshToken = TokenService.generateRefreshToken();
    const newTokenHash = TokenService.hashToken(newRawRefreshToken);

    await prisma.session.create({
      data: {
        userId: session.user.id,
        refreshToken: newTokenHash,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        expiresAt: TokenService.getRefreshTokenExpiryDate(),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  static async logout(rawRefreshToken: string): Promise<void> {
    if (!rawRefreshToken) return;

    const tokenHash = TokenService.hashToken(rawRefreshToken);

    await prisma.session.deleteMany({
      where: { refreshToken: tokenHash },
    });
  }

  static async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error: AppError = new Error('User not found.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return this.sanitizeUser(user);
  }

  static async changePassword(userId: string, data: { currentPassword: string; newPassword: string }): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error: AppError = new Error('User not found.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);

    if (!isValid) {
      const error: AppError = new Error('Current password is incorrect.');
      error.statusCode = 400;
      error.code = 'INVALID_CURRENT_PASSWORD';
      throw error;
    }

    const newPasswordHash = await bcrypt.hash(data.newPassword, this.SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate existing sessions
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  static async forgotPassword(email: string): Promise<{ token?: string }> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success to prevent email enumeration
      return {};
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send email asynchronously via Gmail SMTP
    await EmailService.sendPasswordResetEmail(email, token);

    return { token };
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      const error: AppError = new Error('Invalid or expired password reset token.');
      error.statusCode = 400;
      error.code = 'INVALID_RESET_TOKEN';
      throw error;
    }

    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({
        where: { id: resetRecord.id },
      }),
      prisma.session.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);
  }

  static async googleLogin(token: string, userAgent?: string, ipAddress?: string): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    let email: string = '';
    let name: string = '';
    let avatar: string | null = null;

    if (token.startsWith('ya29.') || !token.includes('.')) {
      try {
        const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
        if (!res.ok) {
          throw new Error('Failed to fetch Google user profile');
        }
        const profile = await res.json();
        if (!profile.email) {
          throw new Error('Google profile missing email');
        }
        email = profile.email.toLowerCase();
        name = profile.name || profile.email.split('@')[0];
        avatar = profile.picture || null;
      } catch (err: any) {
        const error: AppError = new Error('Invalid or expired Google OAuth token.');
        error.statusCode = 401;
        error.code = 'INVALID_GOOGLE_TOKEN';
        throw error;
      }
    } else {
      const client = new OAuth2Client(env.GOOGLE_CLIENT_ID || '900796179060-6nhrdarssbsp4dfpl66bipvmsaqcq9ju.apps.googleusercontent.com');
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: env.GOOGLE_CLIENT_ID || '900796179060-6nhrdarssbsp4dfpl66bipvmsaqcq9ju.apps.googleusercontent.com',
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          email = payload.email.toLowerCase();
          name = payload.name || payload.email.split('@')[0];
          avatar = payload.picture || null;
        }
      } catch (err: any) {
        // Fallback to Google TokenInfo endpoint verification
        try {
          const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
          if (tokenInfoRes.ok) {
            const tokenInfo = await tokenInfoRes.json();
            if (tokenInfo.email) {
              email = tokenInfo.email.toLowerCase();
              name = tokenInfo.name || tokenInfo.email.split('@')[0];
              avatar = tokenInfo.picture || null;
            } else {
              throw new Error('Google tokeninfo missing email');
            }
          } else {
            throw err;
          }
        } catch (fallbackErr) {
          const error: AppError = new Error('Invalid or expired Google OAuth token.');
          error.statusCode = 401;
          error.code = 'INVALID_GOOGLE_TOKEN';
          throw error;
        }
      }
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, this.SALT_ROUNDS);

      user = await prisma.user.create({
        data: {
          email,
          name,
          avatar,
          passwordHash,
          emailVerified: true,
          role: Role.USER,
        },
      });
    } else if (!user.avatar && avatar) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatar },
      });
    }

    const accessToken = TokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const rawRefreshToken = TokenService.generateRefreshToken();
    const tokenHash = TokenService.hashToken(rawRefreshToken);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokenHash,
        userAgent,
        ipAddress,
        expiresAt: TokenService.getRefreshTokenExpiryDate(),
      },
    });

    return {
      user: this.sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
      },
    };
  }

  static async sendVerificationOtp(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      const error: AppError = new Error('No account found with this email address.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: otpCode,
        expiresAt,
      },
    });

    return EmailService.sendOtpEmail(user.email, otpCode);
  }

  static async verifyOtp(email: string, otpCode: string, userAgent?: string, ipAddress?: string): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      const error: AppError = new Error('User account not found.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const verificationRecord = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        token: otpCode.trim(),
      },
    });

    if (!verificationRecord || verificationRecord.expiresAt < new Date()) {
      const error: AppError = new Error('Invalid or expired 6-digit OTP code.');
      error.statusCode = 400;
      error.code = 'INVALID_OTP';
      throw error;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
      prisma.emailVerificationToken.delete({
        where: { id: verificationRecord.id },
      }),
    ]);

    const accessToken = TokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const rawRefreshToken = TokenService.generateRefreshToken();
    const tokenHash = TokenService.hashToken(rawRefreshToken);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokenHash,
        userAgent,
        ipAddress,
        expiresAt: TokenService.getRefreshTokenExpiryDate(),
      },
    });

    return {
      user: this.sanitizeUser(user),
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
      },
    };
  }
}
