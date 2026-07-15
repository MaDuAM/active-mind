// backend/src/routes/entries/by-section.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// GET /entries/by-section?topicId=...
// Liefert alle Sektionen mit bis zu 100 Einträgen pro Sektion
// ============================================
export const getEntriesBySection = async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { topicId } = req.query;
  const topicIdNum = topicId ? Number(topicId) : undefined;

  try {
    // 1. Base filter
    const baseFilter: any = {
      userId,
      deletedAt: null,
      permanentlyRemoved: false,
    };
    if (topicIdNum) {
      baseFilter.topicId = topicIdNum;
    }

    // 2. Parallel queries für alle Sektionen
    const [active, passive, waiting, paused, knowledge] = await Promise.all([
      // ACTIVE + status ACTIVE
      prisma.entry.findMany({
        where: { ...baseFilter, area: 'ACTIVE', status: 'ACTIVE' },
        take: 1000,
        orderBy: { createdAt: 'desc' },
      }),
      // PASSIVE + status ACTIVE
      prisma.entry.findMany({
        where: { ...baseFilter, area: 'PASSIVE', status: 'ACTIVE' },
        take: 1000,
        orderBy: { createdAt: 'desc' },
      }),
      // WAITING (alle außer KNOWLEDGE)
      prisma.entry.findMany({
        where: { ...baseFilter, status: 'WAITING', area: { not: 'KNOWLEDGE' } },
        take: 1000,
        orderBy: { createdAt: 'desc' },
      }),
      // PAUSED (alle außer KNOWLEDGE)
      prisma.entry.findMany({
        where: { ...baseFilter, status: 'PAUSED', area: { not: 'KNOWLEDGE' } },
        take: 1000,
        orderBy: { createdAt: 'desc' },
      }),
      // KNOWLEDGE
      prisma.entry.findMany({
        where: { ...baseFilter, area: 'KNOWLEDGE' },
        take: 1000,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      active,
      passive,
      waiting,
      paused,
      knowledge,
    });
  } catch (error) {
    console.error('Error fetching entries by section:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
};