// backend/src/routes/entries/status.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isValidStatus } from '../validation';

const prisma = new PrismaClient();

// ============================================
// POST /entries/:id/status - Change entry status
// ============================================
export const changeStatus = async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { newStatus, note } = req.body;

  const entry = await prisma.entry.findFirst({
    where: { id: Number(req.params.id), userId },
  });
  if (!entry) return res.status(404).json({ error: 'Not found' });

  if (entry.area === 'KNOWLEDGE') {
    return res.status(400).json({ error: 'Cannot change status of KNOWLEDGE entry' });
  }

  if (!newStatus || !isValidStatus(newStatus)) {
    return res.status(400).json({ error: 'Invalid status. Must be WAITING, ACTIVE, or PAUSED' });
  }

  if (entry.status === newStatus) {
    return res.status(400).json({ error: `Entry is already ${newStatus}` });
  }

  const oldStatus = entry.status;
  await prisma.entry.update({
    where: { id: entry.id },
    data: { status: newStatus },
  });

  await prisma.tracking.create({
    data: {
      entryId: entry.id,
      trackingType: 'STATUS_CHANGE',
      oldStatus,
      newStatus,
      note: note || null,
      timestamp: new Date(),
    },
  });
  res.json({ ok: true });
};