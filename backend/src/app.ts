import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { logger } from './utils/logger.js';

import { requestIdMiddleware } from './middlewares/requestId.middleware.js';

export const app = express();

// Request ID tracking
app.use(requestIdMiddleware);

// Security Headers (Configured for cross-origin image sharing)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Serve static upload directory
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Cookie Parser
app.use(cookieParser());

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);

      // Allow localhost, vercel.app domains, onrender.com domains, or configured APP_URL
      if (
        origin.includes('localhost') ||
        origin.includes('vercel.app') ||
        origin.includes('onrender.com') ||
        origin === env.APP_URL
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
});

app.use('/api', limiter);

// Request Logger
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Root Health Check Handler for Cloud Load Balancers
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SurajAI Production API Engine Running',
    health: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api', routes);

// 404 Route Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    },
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);
