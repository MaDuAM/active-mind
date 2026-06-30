// backend/src/validation.ts

export const isValidArea = (value: string): value is 'KNOWLEDGE' | 'PASSIVE' | 'ACTIVE' => {
  return ['KNOWLEDGE', 'PASSIVE', 'ACTIVE'].includes(value);
};

export const isValidStatus = (value: string): value is 'WAITING' | 'ACTIVE' | 'PAUSED' => {
  return ['WAITING', 'ACTIVE', 'PAUSED'].includes(value);
};

export const isValidStep = (step: any): step is { description: string } => {
  return step && typeof step.description === 'string' && step.description.length > 0;
};

export const isValidSteps = (steps: any[]): steps is { description: string }[] => {
  return Array.isArray(steps) && steps.length > 0 && steps.every(isValidStep);
};