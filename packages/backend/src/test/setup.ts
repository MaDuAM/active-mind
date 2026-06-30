import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, beforeEach } from 'vitest';

const prisma = new PrismaClient();

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.$transaction([
    prisma.tracking.deleteMany(),
    prisma.entry.deleteMany(),
    prisma.topic.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});