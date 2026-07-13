// ============================================
// FILE: backend/src/routes/entries/get.ts
// PURPOSE: Entry retrieval handlers (list with filters, single entry with trackings)
// DEPENDENCIES: express, prisma, validation
// ============================================

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { isValidArea, isValidStatus } from '../validation';

// ============================================
// INITIALIZATION
// ============================================
const prisma = new PrismaClient();

// ============================================
// HANDLER: GET /entries
// PURPOSE: Retrieves paginated entry list with filters
// FILTERS: topicId, area, status, deletedOnly
// SORTING: sortBy, sortOrder (default: createdAt desc)
// PAGINATION: page, limit (max 100)
// AUTHENTICATION: Required (userId from session)
// FIELD SELECTION: Different fields for trash vs active entries
// ============================================
export const getEntries = async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const {
    topicId,
    area,
    status,
    deletedOnly,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  // Sanitize pagination params
  const MAX_LIMIT = 1000; // oder 10000 for Tests
  const limitNum = Math.min(MAX_LIMIT, Math.max(1, Number(limit)));
  const pageNum = Math.max(1, Number(page));
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: Prisma.EntryWhereInput = {
    userId,
  };

  if (topicId) where.topicId = Number(topicId);
  if (area) {
    if (!isValidArea(area as string)) {
      return res.status(400).json({ error: 'Invalid area. Must be KNOWLEDGE, PASSIVE, or ACTIVE' });
    }
    where.area = area as any;
  }
  if (status) {
    if (!isValidStatus(status as string)) {
      return res.status(400).json({ error: 'Invalid status. Must be WAITING, ACTIVE, or PAUSED' });
    }
    where.status = status as any;
  }

  // Soft-delete filter
  if (deletedOnly === 'true') {
    where.deletedAt = { not: null };
    where.permanentlyRemoved = false;
  } else {
    where.deletedAt = null;
  }

  // Validate sort field
  const allowedSortFields = ['createdAt', 'updatedAt', 'id', 'essenceShort', 'status', 'area', 'deletedAt'];
  const sortField = allowedSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
  const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

  // Select different fields for trash vs active entries
  const selectFields = deletedOnly === 'true'
    ? {
        id: true,
        essenceShort: true,
        actionName: true,
        benefit: true,
        topicId: true,
        deletedAt: true,
        area: true,
        status: true,
        isFavorite: true,
      }
    : {
        id: true,
        essenceText: true,
        essenceShort: true,
        area: true,
        actionName: true,
        benefit: true,
        status: true,
        steps: true,
        currentStepIndex: true,
        topicId: true,
        createdAt: true,
        deletedAt: true,
        permanentlyRemoved: true,
        pauseReason: true,
        isFavorite: true,
      };

  try {
    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField as string]: sortDirection },
        select: selectFields,
      }),
      prisma.entry.count({ where }),
    ]);

    res.json({
      data: entries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
};

// ============================================
// HANDLER: GET /entries/:id
// PURPOSE: Retrieves a single entry with its tracking history
// INCLUSIONS: Trackings sorted by timestamp desc
// AUTHENTICATION: Required (userId from session)
// ============================================
export const getEntry = async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const entry = await prisma.entry.findFirst({
    where: {
      id: Number(req.params.id),
      userId,
    },
    include: {
      trackings: {
        orderBy: { timestamp: 'desc' },
      },
    },
  });

  if (!entry) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json(entry);
};