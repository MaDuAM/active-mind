// backend/src/routes/entries/favorite.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// PATCH /entries/:id/favorite - Toggle favorite status
// ============================================
export const toggleFavorite = async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const entry = await prisma.entry.findFirst({
    where: { id: Number(req.params.id), userId },
    select: { id: true, isFavorite: true },
  });

  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  const updated = await prisma.entry.update({
    where: { id: entry.id },
    data: { isFavorite: !entry.isFavorite },
    select: { id: true, isFavorite: true },
  });

  res.json(updated);
};