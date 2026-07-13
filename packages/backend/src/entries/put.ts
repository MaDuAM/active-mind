// ============================================
// FILE: backend/src/routes/entries/put.ts
// PURPOSE: Entry update handler
// DEPENDENCIES: express, prisma
// ============================================

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// ============================================
// INITIALIZATION
// ============================================
const prisma = new PrismaClient();

// ============================================
// HANDLER: PUT /entries/:id
// PURPOSE: Updates an existing entry
// VALIDATION:
//   - essenceText: 1-5000 chars (if provided)
//   - essenceShort: 1-500 chars (if provided)
//   - actionName: max 30 chars (if provided)
//   - benefit: max 500 chars (if provided)
//   - steps: only for ACTIVE entries, 1-30 steps, each description 1-500 chars
// SIDE EFFECT: Always creates ENTRY_EDIT tracking entry
// AUTHENTICATION: Required (userId from session)
// ============================================
export const updateEntry = async (req: Request, res: Response) => {
  const userId = (req.session as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { essenceText, essenceShort, actionName, benefit, steps, changeNote } = req.body;

  const entry = await prisma.entry.findFirst({
    where: { id: Number(req.params.id), userId },
  });
  if (!entry) return res.status(404).json({ error: 'Not found' });

  // Validate fields
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

  // Steps validation for ACTIVE entries
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

  // Steps with order index
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

  // Always create tracking entry (even without changeNote)
  await prisma.tracking.create({
    data: {
      entryId: entry.id,
      trackingType: 'ENTRY_EDIT',
      note: changeNote || 'Entry edited',
      timestamp: new Date(),
    },
  });

  res.json(updated);
};