// backend/src/index.ts

import express from 'express';
const session = require('express-session');
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import authRouter from './auth';
import topicRouter from './topics';
import entryRouter from './entries';

const prisma = new PrismaClient();
const app = express();
const PORT = config.PORT;

// ============================================
// 1. Security: Helmet with CSP
// ============================================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: [
          "'self'",
          config.FRONTEND_URL,
          ...(config.ALLOWED_ORIGINS ? config.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
        ],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ============================================
// 2. CORS Configuration
// ============================================
const allowedOrigins = [
  'http://localhost:5173',
  config.FRONTEND_URL,
  ...(config.ALLOWED_ORIGINS ? config.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
].filter(Boolean) as string[];

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// ============================================
// 3. Rate Limiting
// ============================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Nur Schreiboperationen limitieren (POST, PUT, PATCH, DELETE)
    return ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window (stricter for auth)
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

//app.use('/api/v1/auth/login', authLimiter);
//app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/', globalLimiter);

// ============================================
// 4. Session Configuration
// Uses PostgreSQL session store in production
// ============================================
const sessionStore = config.NODE_ENV === 'production' 
  ? new (require('connect-pg-simple')(session))({
      conString: config.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
    })
  : undefined;

app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: config.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    ...(config.NODE_ENV === 'production' && config.COOKIE_DOMAIN && {
      domain: config.COOKIE_DOMAIN,
    })
  }
}));

// ============================================
// 5. Routes
// ============================================
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/topics', topicRouter);
app.use('/api/v1/entries', entryRouter);

// ============================================
// 6. Health Check
// Verifies database connectivity
// ============================================
app.get('/api/v1/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'unknown',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';
    res.json(health);
  } catch (error) {
    health.status = 'degraded';
    health.database = 'disconnected';
    res.status(503).json(health);
  }
});

// ============================================
// 7. Export for Testing
// ============================================
export default app;

// ============================================
// 8. Server Start
// ============================================
if (config.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    console.log(`Environment: ${config.NODE_ENV}`);
  });
}