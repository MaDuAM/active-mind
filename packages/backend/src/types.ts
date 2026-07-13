// ============================================
// FILE: backend/src/types.ts
// PURPOSE: TypeScript type declarations and module augmentations
// DEPENDENCIES: express-session
// ============================================

import 'express-session';

// ============================================
// SESSION TYPE AUGMENTATION
// PURPOSE: Extends express-session SessionData with userId
// ============================================
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// ============================================
// EXPORT
// ============================================
export {}; // Makes file into a module