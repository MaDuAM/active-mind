// backend/src/entries.ts

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { isValidArea, isValidStatus, isValidSteps } from './validation';

const prisma = new PrismaClient();
const router = Router();

// ============================================
// Get /entries - with pagination and filters
// ============================================
router.get('/', async (req, res) => {
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

  // Validations
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const skip = (pageNum - 1) * limitNum;

  // Where conditions
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

  // Soft-Delete Filter
  if (deletedOnly === 'true') {
    where.deletedAt = { not: null };
    where.permanentlyRemoved = false;
  } else {
    where.deletedAt = null;
  }

  // Validate sorting
  const allowedSortFields = ['createdAt', 'updatedAt', 'id', 'essenceShort', 'status', 'area', 'deletedAt'];
  const sortField = allowedSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
  const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

  // Select fields for trash can vs. normal view
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
});

// ============================================
// Get /entries/:id - Single entry with tracking
// ============================================
router.get('/:id', async (req, res) => {
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
});

// ============================================
// Post /entries - Create new entry
// ============================================
router.post('/', async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { area, topicId, essenceText, essenceShort, actionName, benefit, steps, status } = req.body;

  // 1. Basic validations
  if (!essenceText || essenceText.length > 5000) {
    return res.status(400).json({ error: 'essenceText required, max 5000 characters' });
  }
  if (!essenceShort || essenceShort.length > 500) {
    return res.status(400).json({ error: 'essenceShort required, max 500 characters' });
  }

  // 2. check area enum
  if (!area || !isValidArea(area)) {
    return res.status(400).json({ error: 'Invalid area. Must be KNOWLEDGE, PASSIVE, or ACTIVE' });
  }

  // 3. Check topicId (exists and belongs to the user)
  const topic = await prisma.topic.findFirst({
    where: { id: Number(topicId), userId },
  });
  if (!topic) {
    return res.status(400).json({ error: 'Topic not found or not owned by user' });
  }

  // 4. Domain-specific validations
  const baseData: {
    essenceText: string;
    essenceShort: string;
    area: 'KNOWLEDGE' | 'PASSIVE' | 'ACTIVE';
    topicId: number;
    userId: number;
    actionName?: string;
    benefit?: string;
    steps?: any;
    status?: 'WAITING' | 'ACTIVE' | 'PAUSED';
    currentStepIndex?: number;
    pauseReason?: string | null;
  } = {
    essenceText,
    essenceShort,
    area,
    topicId: Number(topicId),
    userId,
    pauseReason: null,
  };

  if (area === 'KNOWLEDGE') {
    // No other required fields
  } else if (area === 'PASSIVE') {
    if (!actionName || actionName.length > 30) {
      return res.status(400).json({ error: 'actionName required, max 100 characters' });
    }
    if (benefit && benefit.length > 500) {
      return res.status(400).json({ error: 'benefit max 500 characters' });
    }
    if (status && !isValidStatus(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be WAITING, ACTIVE, or PAUSED' });
    }
    baseData.actionName = actionName;
    baseData.benefit = benefit;
    baseData.status = status || 'WAITING';
    if (status === 'WAITING' && req.body.grund) {
      baseData.pauseReason = req.body.grund;
    }
  } else if (area === 'ACTIVE') {
    if (!actionName || actionName.length > 30) {
      return res.status(400).json({ error: 'actionName required, max 100 characters' });
    }
    if (benefit && benefit.length > 500) {
      return res.status(400).json({ error: 'benefit max 500 characters' });
    }
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: 'steps required, min 1' });
    }
    if (steps.length > 30) {
      return res.status(400).json({ error: 'steps max 30' });
    }
    for (const step of steps) {
      if (!step.description || step.description.length === 0) {
        return res.status(400).json({ error: 'Each step must have a description' });
      }
      if (step.description.length > 500) {
        return res.status(400).json({ error: 'Step description max 500 characters' });
      }
    }
    if (status && !isValidStatus(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be WAITING, ACTIVE, or PAUSED' });
    }
    baseData.actionName = actionName;
    baseData.benefit = benefit;
    baseData.steps = steps.map((s: any, idx: number) => ({ order: idx, description: s.description }));
    baseData.status = status || 'WAITING';
    baseData.currentStepIndex = 0;
    if (status === 'WAITING' && req.body.grund) {
      baseData.pauseReason = req.body.grund;
    }
  }

  const entry = await prisma.entry.create({ data: baseData });

  await prisma.tracking.create({
    data: {
      entryId: entry.id,
      trackingType: 'CREATION',
      note: req.body.grund || 'Initial creation',
      timestamp: new Date(),
    },
  });

  res.json(entry);
});

// ============================================
// Put /entries/:id - Update Entry
// ============================================
router.put('/:id', async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { essenceText, essenceShort, actionName, benefit, steps } = req.body;

  const entry = await prisma.entry.findFirst({
    where: { id: Number(req.params.id), userId },
  });
  if (!entry) return res.status(404).json({ error: 'Not found' });

  // Validations
  if (essenceText !== undefined) {
    if (!essenceText || essenceText.length === 0 || essenceText.length > 5000) {
      return res.status(400).json({ error: 'essenceText must be 1-5000 characters' });
    }
  }
  if (essenceShort !== undefined) {
    if (!essenceShort || essenceShort.length === 0 || essenceShort.length > 500) {
      return res.status(400).json({ error: 'essenceShort must be 1-500 characters' });
    }
  }
  if (actionName !== undefined && actionName.length > 30) {
    return res.status(400).json({ error: 'actionName max 30 characters' });
  }
  if (benefit !== undefined && benefit.length > 500) {
    return res.status(400).json({ error: 'benefit max 500 characters' });
  }

  if (steps !== undefined && entry.area === 'ACTIVE') {
    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: 'steps required, min 1' });
    }
    if (steps.length > 30) {
      return res.status(400).json({ error: 'steps max 30' });
    }
    for (const step of steps) {
      if (!step.description || step.description.length === 0) {
        return res.status(400).json({ error: 'Each step must have a description' });
      }
      if (step.description.length > 500) {
        return res.status(400).json({ error: 'Step description max 500 characters' });
      }
    }
  }

  if (steps !== undefined && entry.area !== 'ACTIVE') {
    return res.status(400).json({ error: 'steps only allowed for ACTIVE entries' });
  }

  // Steps labelled with order index
  let stepsWithOrder = undefined;
  if (steps !== undefined) {
    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ error: 'steps must be a non-empty array' });
    }
    stepsWithOrder = steps.map((s: any, idx: number) => ({
      order: idx,
      description: s.description,
    }));
  }

  const updated = await prisma.entry.update({
    where: { id: entry.id },
    data: {
      essenceText: essenceText !== undefined ? essenceText : entry.essenceText,
      essenceShort: essenceShort !== undefined ? essenceShort : entry.essenceShort,
      actionName: actionName !== undefined ? actionName : entry.actionName,
      benefit: benefit !== undefined ? benefit : entry.benefit,
      steps: stepsWithOrder !== undefined ? stepsWithOrder : (entry.steps ?? undefined),
      updatedAt: new Date(),
    },
  });

  if (req.body.changeNote) {
    await prisma.tracking.create({
      data: {
        entryId: entry.id,
        trackingType: 'ENTRY_EDIT',
        note: req.body.changeNote,
        timestamp: new Date(),
      },
    });
  }

  res.json(updated);
});

// ============================================
// Delete /entries/:id - Soft-Delete
// ============================================
router.delete('/:id', async (req, res) => {
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
});

// ============================================
// Post /entries/:id/restore - Restore from Recycle Bin
// ============================================
router.post('/:id/restore', async (req, res) => {
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
});

// ============================================
// Delete /entries/:id/permanent - Permanently delete
// ============================================
router.delete('/:id/permanent', async (req, res) => {
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
});

// ============================================
// Post /entries/:id/status - Change status
// ============================================
router.post('/:id/status', async (req, res) => {
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
});

// ============================================
// Post /entries/:id/step - Change step
// ============================================
router.post('/:id/step', async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { newStepIndex, note } = req.body;

  const entry = await prisma.entry.findFirst({
    where: { id: Number(req.params.id), userId },
  });
  if (!entry) return res.status(404).json({ error: 'Not found' });

  if (entry.area !== 'ACTIVE') {
    return res.status(400).json({ error: 'Step change only allowed for ACTIVE entries' });
  }

  if (!entry.steps || !Array.isArray(entry.steps) || entry.steps.length === 0) {
    return res.status(400).json({ error: 'Entry has no steps' });
  }

  if (newStepIndex === undefined || newStepIndex === null) {
    return res.status(400).json({ error: 'newStepIndex required' });
  }
  if (typeof newStepIndex !== 'number' || !Number.isInteger(newStepIndex)) {
    return res.status(400).json({ error: 'newStepIndex must be an integer' });
  }
  if (newStepIndex < 0 || newStepIndex >= entry.steps.length) {
    return res.status(400).json({ error: `newStepIndex must be between 0 and ${entry.steps.length - 1}` });
  }

  const steps = entry.steps as { order: number; description: string }[] | null;
  if (!steps || !Array.isArray(steps)) {
    return res.status(400).json({ error: 'Entry has no valid steps' });
  }
  const previousStep = steps[entry.currentStepIndex || 0]?.description;
  const newStep = steps[newStepIndex]?.description;

  await prisma.entry.update({
    where: { id: entry.id },
    data: { currentStepIndex: newStepIndex },
  });

  await prisma.tracking.create({
    data: {
      entryId: entry.id,
      trackingType: 'STEP_CHANGE',
      previousStep,
      newStep,
      note: note || null,
      timestamp: new Date(),
    },
  });
  res.json({ ok: true });
});

// ============================================
// Post /entries/:id/tracking/manual - Manual tracking
// ============================================
router.post('/:id/tracking/manual', async (req, res) => {
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
});

export default router;