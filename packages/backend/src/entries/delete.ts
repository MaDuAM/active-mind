// ============================================
// FILE: backend/src/routes/entries/delete.ts
// PURPOSE: Entry deletion handlers (soft delete, permanent delete, restore)
// DEPENDENCIES: express, prisma
// ============================================

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// ============================================
// INITIALIZATION
// ============================================
const prisma = new PrismaClient();

// ============================================
// HANDLER: DELETE /entries/:id
// PURPOSE: Soft-deletes an entry (moves to trash)
// BEHAVIOR: Sets deletedAt timestamp, entry remains in database
// AUTHENTICATION: Required (userId from session)
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
// HANDLER: DELETE /entries/:id/permanent
// PURPOSE: Permanently deletes an entry (cannot be undone)
// BEHAVIOR: Sets permanentlyRemoved flag to true
// AUTHENTICATION: Required (userId from session)
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
// HANDLER: POST /entries/:id/restore
// PURPOSE: Restores a soft-deleted entry from trash
// BEHAVIOR: Clears deletedAt, resets status to WAITING (for non-KNOWLEDGE)
// SIDE EFFECT: Creates RESTORE tracking entry
// AUTHENTICATION: Required (userId from session)
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