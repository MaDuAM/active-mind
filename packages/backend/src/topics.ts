// backend/src/topics.ts

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// ============================================
// GET /topics - Fetch all topics for current user
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
// POST /topics - Create a new topic
// ============================================
router.post('/', async (req, res) => {
  const { name } = req.body;
  const userId = (req.session as any).userId;
  
  // 1. Validate name exists
  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }
  
  // 2. Validate name length (1-100 characters)
  if (typeof name !== 'string' || name.length === 0 || name.length > 100) {
    return res.status(400).json({ error: 'Name must be 1-100 characters' });
  }
  
  // 3. Trim whitespace
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return res.status(400).json({ error: 'Name cannot be empty or only whitespace' });
  }
  
  // 4. Check for duplicate (same user, same name)
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
// DELETE /topics/:id - Delete a topic
// 
// Rules:
// - Cannot delete if active entries exist
// - Cannot delete if trash entries exist
// - Permanently removed entries are deleted first
// - Final check ensures no entries remain
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

export default router;