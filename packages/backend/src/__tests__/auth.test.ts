import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../index';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
let cookie: string = '';

describe('Auth', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany();

    const hash = await bcrypt.hash('test123', 10);
    await prisma.user.create({
      data: { username: 'testuser', passwordHash: hash }
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testuser', password: 'test123' });
    
    console.log('Login Status:', loginRes.status);
    console.log('Login Body:', loginRes.body);
    console.log('Cookie Header:', loginRes.headers['set-cookie']);
    
    const cookieHeader = loginRes.headers['set-cookie'];
    if (cookieHeader && Array.isArray(cookieHeader)) {
      cookie = cookieHeader[0].split(';')[0];
    }
    console.log('Extracted Cookie:', cookie);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /register - success', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser2', password: 'test123' });
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('testuser2');
  });

  it('POST /register - duplicate', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'testuser', password: 'test123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already taken');
  });

  it('POST /login - success', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testuser', password: 'test123' });
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('testuser');
  });

  it('POST /login - wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'testuser', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid credentials');
  });

  it('GET /me - authenticated', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('testuser');
  });

  it('GET /me - unauthenticated', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('POST /logout - success', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    
    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);
    expect(me.status).toBe(401);
  });
});