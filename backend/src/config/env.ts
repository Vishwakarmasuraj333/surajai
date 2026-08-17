import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  APP_NAME: z.string().default('SurajAI'),
  APP_URL: z.string().default('http://localhost:3000'),
  BACKEND_URL: z.string().default('http://localhost:5000'),

  DATABASE_URL: z.string().default('mysql://root:root@localhost:3306/surajai_db'),

  JWT_SECRET: z.string().default('surajai_jwt_secret_dev_key_2026_secure'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().default('surajai_refresh_secret_dev_key_2026_secure'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // AI Provider Credentials
  AI_DEFAULT_PROVIDER: z.string().default('gemini'),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),

  GEMINI_API_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  AI_API_KEY: z.string().optional().default(''),

  // Google OAuth Credentials
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),

  // SMTP Email Credentials
  SMTP_HOST: z.string().optional().default('smtp.gmail.com'),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)).default('587'),
  SMTP_USER: z.string().optional().default('itxsurajofficial@gmail.com'),
  SMTP_PASS: z.string().optional().default('heaj voeo tpbv nqua'),

  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform((val) => parseInt(val, 10)).default('100'),
});

const _env = envSchema.safeParse({
  ...process.env,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-1.5-flash',
});

if (!_env.success) {
  console.error('❌ Environment Variable Validation Errors:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
