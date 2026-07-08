// backend/src/routes/entries/tracking.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// POST /entries/:id/tracking/manual - Manual tracking
// ============================================
export const addManualTracking = async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { timestamp, note } = req.body;

  const entry = await prisma.entry.findFirst({
    where: { id: Number(req.params.id), userId },
  });
  if (!entry) return res.status(404).json({ error: 'Not found' });

  if (!timestamp) {
    return res.status(400).json({ error: 'timestamp required' });
  }
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return res.status(400).json({ error: 'Invalid timestamp format' });
  }

  if (note && note.length > 500) {
    return res.status(400).json({ error: 'note max 500' });
  }

  await prisma.tracking.create({
    data: {
      entryId: entry.id,
      trackingType: 'MANUAL',
      timestamp: date,
      note: note || null,
    },
  });
  res.json({ ok: true });
};