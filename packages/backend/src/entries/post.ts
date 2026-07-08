// backend/src/routes/entries/post.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isValidArea, isValidStatus } from '../validation';

const prisma = new PrismaClient();

// ============================================
// POST /entries - Create new entry
// ============================================
export const createEntry = async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { area, topicId, essenceText, essenceShort, actionName, benefit, steps, status } = req.body;

  // 1. Validate required fields
  if (!essenceText || essenceText.length > 5000) {
    return res.status(400).json({ error: 'essenceText required, max 5000 characters' });
  }
  if (!essenceShort || essenceShort.length > 500) {
    return res.status(400).json({ error: 'essenceShort required, max 500 characters' });
  }

  // 2. Validate area enum
  if (!area || !isValidArea(area)) {
    return res.status(400).json({ error: 'Invalid area. Must be KNOWLEDGE, PASSIVE, or ACTIVE' });
  }

  // 3. Validate topic ownership
  const topic = await prisma.topic.findFirst({
    where: { id: Number(topicId), userId },
  });
  if (!topic) {
    return res.status(400).json({ error: 'Topic not found or not owned by user' });
  }

  // 4. Area-specific validations
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
    // Knowledge entries have no action fields
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

  // Create initial tracking entry
  await prisma.tracking.create({
    data: {
      entryId: entry.id,
      trackingType: 'CREATION',
      note: req.body.grund || 'Initial creation',
      timestamp: new Date(),
    },
  });

  res.json(entry);
};