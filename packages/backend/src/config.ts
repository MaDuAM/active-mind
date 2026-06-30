// backend/src/config.ts

import { z } from 'zod';

// ============================================
// Schema Definition
// ============================================
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Session
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),

  // Database
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL is required'),

  // Optional: Cookie Domain (nur in Production)
  COOKIE_DOMAIN: z.string().optional(),

  // Optional: CORS
  ALLOWED_ORIGINS: z.string().optional().default(''),

  // Optional: Session Table Name (für connect-pg-simple)
  SESSION_TABLE_NAME: z.string().default('session'),
});

// ============================================
// Validation & Export
// ============================================
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

// ============================================
// Type Export für TypeScript
// ============================================
export type Config = z.infer<typeof envSchema>;