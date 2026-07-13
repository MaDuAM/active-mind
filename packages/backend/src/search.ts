// backend/src/routes/search.ts

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// ============================================
// GET /search?q=... - Einfache ILIKE-Suche
// ============================================
router.get('/', async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { q, limit = 50, page = 1 } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.status(400).json({ error: 'Search query required' });
  }

  const searchTerm = `%${q.trim()}%`;
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const pageNum = Math.max(1, Number(page));
  const skip = (pageNum - 1) * limitNum;

  try {
    // 1. ILIKE-Suche über alle relevanten Felder
    const results = await prisma.$queryRaw`
      SELECT *
      FROM "Entry" e
      WHERE e."userId" = ${userId}
        AND e."deletedAt" IS NULL
        AND e."permanentlyRemoved" = false
        AND (
          e."essenceText" ILIKE ${searchTerm}
          OR e."essenceShort" ILIKE ${searchTerm}
          OR e."actionName" ILIKE ${searchTerm}
          OR e."benefit" ILIKE ${searchTerm}
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(e.steps) AS step
            WHERE step->>'description' ILIKE ${searchTerm}
          )
        )
      ORDER BY e."createdAt" DESC
      LIMIT ${limitNum}
      OFFSET ${skip}
    `;

    // 2. Gesamtanzahl
    const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint
      FROM "Entry" e
      WHERE e."userId" = ${userId}
        AND e."deletedAt" IS NULL
        AND e."permanentlyRemoved" = false
        AND (
          e."essenceText" ILIKE ${searchTerm}
          OR e."essenceShort" ILIKE ${searchTerm}
          OR e."actionName" ILIKE ${searchTerm}
          OR e."benefit" ILIKE ${searchTerm}
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(e.steps) AS step
            WHERE step->>'description' ILIKE ${searchTerm}
          )
        )
    `;

    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;