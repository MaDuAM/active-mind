// backend/src/routes/entries/delete.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// DELETE /entries/:id - Soft delete (move to trash)
// ============================================
export const softDeleteEntry = async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const entry = await prisma.entry.findFirst({
    where: { id: Number(req.params.id), userId },
  });
  if (!entry) return res.status(404).json({ error: 'Not found' });

  await prisma.entry.update({
    where: { id: entry.id },
    data: { deletedAt: new Date() },
  });
  res.json({ ok: true });
};

// ============================================
// DELETE /entries/:id/permanent - Permanently delete
// ============================================
export const permanentDeleteEntry = async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const entry = await prisma.entry.findFirst({
    where: { id: Number(req.params.id), userId },
  });
  if (!entry) return res.status(404).json({ error: 'Not found' });

  await prisma.entry.update({
    where: { id: entry.id },
    data: { permanentlyRemoved: true },
  });
  res.json({ ok: true });
};

// ============================================
// POST /entries/:id/restore - Restore from trash
// ============================================
export const restoreEntry = async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const entry = await prisma.entry.findFirst({
    where: { id: Number(req.params.id), userId },
  });
  if (!entry) return res.status(404).json({ error: 'Not found' });

  await prisma.entry.update({
    where: { id: entry.id },
    data: {
      deletedAt: null,
      status: entry.area === 'KNOWLEDGE' ? null : 'WAITING',
    },
  });

  await prisma.tracking.create({
    data: {
      entryId: entry.id,
      trackingType: 'RESTORE',
      timestamp: new Date(),
    },
  });

  res.json({ ok: true });
};