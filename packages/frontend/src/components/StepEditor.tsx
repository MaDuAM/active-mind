// frontend/src/components/StepEditor.tsx

import { Step } from '../types';

interface StepEditorProps {
  steps: Step[];
  onChange: (steps: Step[]) => void;
  maxSteps?: number;
  label?: string;
  disabled?: boolean;
}

export function StepEditor({
  steps,
  onChange,
  maxSteps = 30,
  label = 'Steps',
  disabled = false,
}: StepEditorProps) {
  const handleAddStep = () => {
    if (steps.length < maxSteps) {
      const newSteps = [...steps, { order: steps.length, description: '' }];
      onChange(newSteps);
    }
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      newSteps.forEach((step, i) => { step.order = i; });
      onChange(newSteps);
    }
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index].description = value;
    onChange(newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const targetIndex = index + (direction === 'up' ? -1 : 1);
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    newSteps.forEach((step, i) => { step.order = i; });
    onChange(newSteps);
  };

  const allStepsFilled = steps.every((step) => step.description.trim() !== '');

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label">
          {label} * (max {maxSteps})
        </label>
        <span className="text-xs text-[var(--text-muted)]">
          {steps.length}/{maxSteps}
        </span>
      </div>
      <div className="space-y-2">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--text-muted)] w-6 text-right">
              {idx + 1}.
            </span>
            <input
              value={step.description}
              onChange={(e) => handleStepChange(idx, e.target.value)}
              className="input flex-1"
              placeholder={`Step ${idx + 1}`}
              disabled={disabled}
            />
            {steps.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveStep(idx)}
                className="text-[var(--text-muted)] hover:text-error transition p-1"
                disabled={disabled}
                aria-label="Remove step"
              >
                🗑️
              </button>
            )}
            {/* ============================================ */}
            {/* FIX: aria-label für Barrierefreiheit */}
            {/* ============================================ */}
            <button
              type="button"
              onClick={() => moveStep(idx, 'up')}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-1"
              disabled={disabled || idx === 0}
              aria-label="Move step up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => moveStep(idx, 'down')}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition p-1"
              disabled={disabled || idx === steps.length - 1}
              aria-label="Move step down"
            >
              ↓
            </button>
          </div>
        ))}
        {steps.length < maxSteps && (
          <button
            type="button"
            onClick={handleAddStep}
            className="btn-secondary text-sm w-full"
            disabled={disabled || !allStepsFilled}
          >
            + Add step
          </button>
        )}
      </div>
    </div>
  );
}