// ============================================
// FILE: backend/src/auth.ts
// PURPOSE: Authentication routes (login, register, logout, session check)
// DEPENDENCIES: express, bcrypt, prisma, express-session
// ============================================

import { Router } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

// ============================================
// TYPE EXTENSIONS
// ============================================
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// ============================================
// INITIALIZATION
// ============================================
const prisma = new PrismaClient();
const router = Router();

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validates username format
 * - 3-20 characters
 * - Alphanumeric and underscore only
 */
const isValidUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

/**
 * Validates password length
 * - 6-100 characters
 */
const isValidPassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 100;
};

// ============================================
// ROUTE: POST /setup
// PURPOSE: Creates initial admin user on first run
// BEHAVIOR: Only works if no users exist in database
// SECURITY: Returns 400 if any user already exists
// ============================================
router.post('/setup', async (req, res) => {
  const existing = await prisma.user.findFirst();
  if (existing) {
    return res.status(400).json({ error: 'Setup already done. User exists.' });
  }
  
  const hash = await bcrypt.hash('admin357', 10);
  const user = await prisma.user.create({
    data: { username: 'admin', passwordHash: hash }
  });
  
  (req.session as any).userId = user.id;
  res.json({ message: 'Admin created. Login with admin/admin123', user: { id: user.id, username: user.username } });
});

// ============================================
// ROUTE: POST /register
// PURPOSE: Creates a new user account
// VALIDATION: Username format, password length, duplicate check
// BEHAVIOR: Auto-logs in user after successful registration
// ============================================
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  // Validate username
  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }
  if (typeof username !== 'string') {
    return res.status(400).json({ error: 'Username must be a string' });
  }
  if (!isValidUsername(username)) {
    return res.status(400).json({ 
      error: 'Username must be 3-20 characters, alphanumeric and underscore only' 
    });
  }
  
  // Validate password
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }
  if (typeof password !== 'string') {
    return res.status(400).json({ error: 'Password must be a string' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ 
      error: 'Password must be 6-100 characters' 
    });
  }
  
  // Check for duplicate username
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return res.status(400).json({ error: 'Username already taken' });
  }
  
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ 
    data: { username, passwordHash: hash } 
  });
  
  // Auto-login after registration
  (req.session as any).userId = user.id;
  res.json({ id: user.id, username: user.username });
});

// ============================================
// ROUTE: POST /login
// PURPOSE: Authenticates existing user
// VALIDATION: Username exists, password matches hash
// BEHAVIOR: Stores userId in session on success
// ============================================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Validate username
  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }
  if (typeof username !== 'string') {
    return res.status(400).json({ error: 'Username must be a string' });
  }
  
  // Validate password
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }
  if (typeof password !== 'string') {
    return res.status(400).json({ error: 'Password must be a string' });
  }
  
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Store userId in session
  (req.session as any).userId = user.id;
  res.json({ id: user.id, username: user.username });
});

// ============================================
// ROUTE: POST /logout
// PURPOSE: Destroys server-side session
// BEHAVIOR: Clears cookie and invalidates session
// ============================================
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// ============================================
// ROUTE: GET /me
// PURPOSE: Returns current user info if authenticated
// BEHAVIOR: Returns 401 if no valid session
// ============================================
router.get('/me', async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).json({ error: 'Not logged in' });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  res.json({ id: user?.id, username: user?.username });
});

// ============================================
// EXPORT
// ============================================
export default router;