// ============================================
// FILE: backend/src/routes/search.ts
// PURPOSE: Full-text search endpoint using ILIKE across entry fields
// DEPENDENCIES: express, prisma
// ============================================

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

// ============================================
// INITIALIZATION
// ============================================
const prisma = new PrismaClient();
const router = Router();

// ============================================
// ROUTE: GET /search?q=...
// PURPOSE: Searches entries using ILIKE pattern matching
// FIELDS: essenceText, essenceShort, actionName, benefit, step descriptions
// AUTHENTICATION: Required (userId from session)
// PAGINATION: Supports page and limit (max 100)
// ============================================
router.get('/', async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { q, limit = 50, page = 1 } = req.query;

  // Validate search query
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.status(400).json({ error: 'Search query required' });
  }

  const searchTerm = `%${q.trim()}%`;
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const pageNum = Math.max(1, Number(page));
  const skip = (pageNum - 1) * limitNum;

  try {
    // Search across all relevant fields using ILIKE
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

    // Count total results for pagination
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

// ============================================
// EXPORT
// ============================================
export default router;