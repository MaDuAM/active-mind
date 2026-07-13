// ============================================
// FILE: backend/src/routes/topics.ts
// PURPOSE: Topic management endpoints (CRUD operations)
// DEPENDENCIES: express, prisma
// ============================================

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

// ============================================
// INITIALIZATION
// ============================================
const prisma = new PrismaClient();
const router = Router();

// ============================================
// ROUTE: GET /topics
// PURPOSE: Fetches all topics for the current user
// AUTHENTICATION: Required (userId from session)
// ============================================
router.get('/', async (req, res) => {
  const topics = await prisma.topic.findMany({
    where: { userId: (req.session as any).userId },
    select: {
      id: true,
      name: true,
    }
  });
  res.json(topics);
});

// ============================================
// ROUTE: POST /topics
// PURPOSE: Creates a new topic for the current user
// VALIDATION: Name required, 1-100 characters, no duplicates per user
// AUTHENTICATION: Required (userId from session)
// ============================================
router.post('/', async (req, res) => {
  const { name } = req.body;
  const userId = (req.session as any).userId;
  
  // Validate name exists
  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }
  
  // Validate name length (1-100 characters)
  if (typeof name !== 'string' || name.length === 0 || name.length > 100) {
    return res.status(400).json({ error: 'Name must be 1-100 characters' });
  }
  
  // Trim whitespace
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return res.status(400).json({ error: 'Name cannot be empty or only whitespace' });
  }
  
  // Check for duplicate (same user, same name)
  const existing = await prisma.topic.findFirst({
    where: { 
      userId,
      name: trimmedName
    }
  });
  if (existing) {
    return res.status(400).json({ error: 'Topic with this name already exists' });
  }
  
  const topic = await prisma.topic.create({
    data: { name: trimmedName, userId },
  });
  res.json(topic);
});

// ============================================
// ROUTE: DELETE /topics/:id
// PURPOSE: Deletes a topic (only if no entries remain)
// RULES:
//   - Cannot delete if active or trash entries exist
//   - Permanently removed entries are deleted first
//   - Final safety check ensures no entries remain
// AUTHENTICATION: Required (userId from session)
// ============================================
router.delete('/:id', async (req, res) => {
  const userId = (req.session as any).userId;
  
  // Fetch topic with all its entries
  const topic = await prisma.topic.findFirst({
    where: { id: Number(req.params.id), userId },
    include: { entries: true }
  });
  
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  
  // Check for active entries (not deleted)
  const hasActiveEntries = topic.entries.some(e => e.deletedAt === null);
  // Check for entries in trash (soft-deleted but not permanently removed)
  const hasTrashEntries = topic.entries.some(e => e.deletedAt !== null && e.permanentlyRemoved === false);
  // Check for permanently removed entries
  const hasPermanentlyRemoved = topic.entries.some(e => e.permanentlyRemoved === true);

  // Block deletion if active or trash entries exist
  if (hasActiveEntries || hasTrashEntries) {
    return res.status(400).json({ 
      error: 'Can not delete Topic-Block. First delete all its connected active/passive/knowledge and removed entries.' 
    });
  }

  // Delete permanently removed entries before topic deletion
  if (hasPermanentlyRemoved) {
    await prisma.entry.deleteMany({ where: { topicId: topic.id, permanentlyRemoved: true } });
  }

  // Final safety check: ensure no entries remain
  const remainingEntries = await prisma.entry.count({
    where: { topicId: topic.id }
  });
  if (remainingEntries > 0) {
    return res.status(400).json({ 
      error: 'Can not delete Topic-Block. Connected entries still exist in: Removed Entries.'
    });
  }
  
  await prisma.topic.delete({ where: { id: topic.id } });
  res.json({ ok: true });
});

// ============================================
// EXPORT
// ============================================
export default router;