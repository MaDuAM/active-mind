// backend/src/auth.ts

import { Router } from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

const prisma = new PrismaClient();
const router = Router();

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate username format
 * - 3-20 characters
 * - Alphanumeric and underscore only
 */
const isValidUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

/**
 * Validate password length
 * - 6-100 characters
 */
const isValidPassword = (password: string): boolean => {
  return password.length >= 6 && password.length <= 100;
};

// ============================================
// Setup Route
// Creates initial admin user if no users exist
// Used for first-time setup only
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
// Register Route
// Creates a new user account
// ============================================
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  // 1. Validate username
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
  
  // 2. Validate password
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
  
  // 3. Check for duplicate username
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
// Login Route
// Authenticates existing user
// ============================================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // 1. Validate username
  if (!username) {
    return res.status(400).json({ error: 'Username required' });
  }
  if (typeof username !== 'string') {
    return res.status(400).json({ error: 'Username must be a string' });
  }
  
  // 2. Validate password
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
// Logout Route
// Destroys server-side session
// ============================================
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// ============================================
// Me Route
// Returns current user info if authenticated
// ============================================
router.get('/me', async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).json({ error: 'Not logged in' });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  res.json({ id: user?.id, username: user?.username });
});

export default router;