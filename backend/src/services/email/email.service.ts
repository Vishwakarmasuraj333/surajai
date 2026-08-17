import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  static isConfigured(): boolean {
    return Boolean(env.SMTP_USER && env.SMTP_PASS);
  }

  static async sendPasswordResetEmail(toEmail: string, resetToken: string): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('[EmailService] SMTP credentials not configured. Skipping email send.');
      return false;
    }

    const resetLink = `${env.APP_URL}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0c16; color: #e2e8f0; padding: 30px; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #a855f7; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">SurajAI Workspace</h1>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Password Reset Instructions</p>
        </div>
        <div style="background-color: #131525; padding: 20px; border-radius: 12px; border: 1px solid #334155/40; margin-bottom: 25px;">
          <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">Hello,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">We received a request to reset your password for your <strong>SurajAI</strong> account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 700; border-radius: 10px; display: inline-block; box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);">
              Reset Password
            </a>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">If you did not request a password reset, you can safely ignore this email. This link will expire in 1 hour.</p>
        </div>
        <div style="text-align: center; font-size: 11px; color: #64748b;">
          &copy; ${new Date().getFullYear()} SurajAI Platform. All rights reserved.
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"SurajAI Team" <${env.SMTP_USER}>`,
        to: toEmail,
        subject: '🔐 Reset Your SurajAI Password',
        html: htmlContent,
      });

      logger.info(`[EmailService] Password reset email sent successfully to ${toEmail}`);
      return true;
    } catch (err: any) {
      logger.error(`[EmailService] Failed to send password reset email to ${toEmail}:`, err.message);
      return false;
    }
  }
}
