// backend/src/topics.ts

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Alle Topics des Users
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

// Neues Topic
router.post('/', async (req, res) => {
  const { name } = req.body;
  const userId = (req.session as any).userId;
  
  // 1. Name vorhanden?
  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }
  
  // 2. Name Länge prüfen (1-100)
  if (typeof name !== 'string' || name.length === 0 || name.length > 100) {
    return res.status(400).json({ error: 'Name must be 1-100 characters' });
  }
  
  // 3. Name trimmen (keine Leerzeichen am Anfang/Ende)
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return res.status(400).json({ error: 'Name cannot be empty or only whitespace' });
  }
  
  // 4. Duplikat prüfen (gleicher User, gleicher Name)
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

// Topic löschen (mit Prüfung gemäß FS Punkt 3)
router.delete('/:id', async (req, res) => {
  const userId = (req.session as any).userId;
  
  const topic = await prisma.topic.findFirst({
    where: { id: Number(req.params.id), userId },
    include: { entries: true }
  });
  
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  
  const hasActiveEntries = topic.entries.some(e => e.deletedAt === null);
  const hasTrashEntries = topic.entries.some(e => e.deletedAt !== null && e.permanentlyRemoved === false);
  const hasPermanentlyRemoved = topic.entries.some(e => e.permanentlyRemoved === true);

  if (hasActiveEntries || hasTrashEntries) {
    return res.status(400).json({ 
      error: 'Can not delete Topic-Block. First delete all its connected active/passive/knowledge and removed entries.' 
    });
  }

  // Lösche permanent entfernte Einträge vor Topic-Löschung
  if (hasPermanentlyRemoved) {
    await prisma.entry.deleteMany({ where: { topicId: topic.id, permanentlyRemoved: true } });
  }

  // Nochmal prüfen (nach deleteMany)
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