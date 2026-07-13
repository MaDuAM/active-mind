// ============================================
// FILE: backend/src/validation.ts
// PURPOSE: Type guard functions for validating domain entities
// DEPENDENCIES: None (pure TypeScript)
// ============================================

// ============================================
// AREA VALIDATION
// PURPOSE: Validates if a string is a valid Entry area
// VALUES: KNOWLEDGE | PASSIVE | ACTIVE
// ============================================
export const isValidArea = (value: string): value is 'KNOWLEDGE' | 'PASSIVE' | 'ACTIVE' => {
  return ['KNOWLEDGE', 'PASSIVE', 'ACTIVE'].includes(value);
};

// ============================================
// STATUS VALIDATION
// PURPOSE: Validates if a string is a valid Entry status
// VALUES: WAITING | ACTIVE | PAUSED
// ============================================
export const isValidStatus = (value: string): value is 'WAITING' | 'ACTIVE' | 'PAUSED' => {
  return ['WAITING', 'ACTIVE', 'PAUSED'].includes(value);
};

// ============================================
// STEP VALIDATION
// PURPOSE: Validates if an object is a valid Step
// REQUIRED: description must be a non-empty string
// ============================================
export const isValidStep = (step: any): step is { description: string } => {
  return step && typeof step.description === 'string' && step.description.length > 0;
};

// ============================================
// STEPS ARRAY VALIDATION
// PURPOSE: Validates if an array contains valid Steps
// REQUIREMENTS: Non-empty array, all items must be valid Steps
// ============================================
export const isValidSteps = (steps: any[]): steps is { description: string }[] => {
  return Array.isArray(steps) && steps.length > 0 && steps.every(isValidStep);
};