// ============================================
// FILE: backend/src/routes/entries/index.ts
// PURPOSE: Entry routes aggregator - mounts all entry sub-routes
// DEPENDENCIES: express, all entry handlers
// ============================================

import { Router } from 'express';
import * as getHandlers from './get';
import * as postHandlers from './post';
import * as putHandlers from './put';
import * as deleteHandlers from './delete';
import * as statusHandlers from './status';
import * as stepHandlers from './step';
import * as trackingHandlers from './tracking';
import * as favoriteHandlers from './favorite';
import * as sectionHandlers from './by-section';

// ============================================
// INITIALIZATION
// ============================================
const router = Router();

// ============================================
// ROUTE MOUNTS
// ============================================

// GET routes
router.get('/', getHandlers.getEntries);
router.get('/by-section', sectionHandlers.getEntriesBySection);
router.get('/:id', getHandlers.getEntry);

// POST routes
router.post('/', postHandlers.createEntry);
router.post('/:id/restore', deleteHandlers.restoreEntry);
router.post('/:id/status', statusHandlers.changeStatus);
router.post('/:id/step', stepHandlers.changeStep);
router.post('/:id/tracking/manual', trackingHandlers.addManualTracking);
router.patch('/:id/favorite', favoriteHandlers.toggleFavorite);

// PUT routes
router.put('/:id', putHandlers.updateEntry);

// DELETE routes
router.delete('/:id', deleteHandlers.softDeleteEntry);
router.delete('/:id/permanent', deleteHandlers.permanentDeleteEntry);

// ============================================
// EXPORT
// ============================================
export default router;