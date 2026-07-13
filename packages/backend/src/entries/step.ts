// ============================================
// FILE: backend/src/routes/entries/step.ts
// PURPOSE: Entry step change handler for ACTIVE entries
// DEPENDENCIES: express, prisma
// ============================================

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

// ============================================
// INITIALIZATION
// ============================================
const prisma = new PrismaClient();

// ============================================
// HANDLER: POST /entries/:id/step
// PURPOSE: Changes the current step index of an ACTIVE entry
// RESTRICTIONS: Only allowed for ACTIVE entries with steps
// VALIDATION: newStepIndex must be a valid integer within steps range
// SIDE EFFECT: Creates STEP_CHANGE tracking entry with previous/new step descriptions
// AUTHENTICATION: Required (userId from session)
// ============================================
export const changeStep = async (req: Request, res: Response) => {
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
};