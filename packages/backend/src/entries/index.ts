// backend/src/routes/entries/index.ts

import { Router } from 'express';
import * as getHandlers from './get';
import * as postHandlers from './post';
import * as putHandlers from './put';
import * as deleteHandlers from './delete';
import * as statusHandlers from './status';
import * as stepHandlers from './step';
import * as trackingHandlers from './tracking';

const router = Router();

// GET routes
router.get('/', getHandlers.getEntries);
router.get('/:id', getHandlers.getEntry);

// POST routes
router.post('/', postHandlers.createEntry);
router.post('/:id/restore', deleteHandlers.restoreEntry);
router.post('/:id/status', statusHandlers.changeStatus);
router.post('/:id/step', stepHandlers.changeStep);
router.post('/:id/tracking/manual', trackingHandlers.addManualTracking);

// PUT routes
router.put('/:id', putHandlers.updateEntry);

// DELETE routes
router.delete('/:id', deleteHandlers.softDeleteEntry);
router.delete('/:id/permanent', deleteHandlers.permanentDeleteEntry);

export default router;