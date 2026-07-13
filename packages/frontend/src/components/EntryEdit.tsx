// ============================================
// FILE: frontend/src/components/EntryEdit.tsx
// PURPOSE: Entry edit form with area-specific fields and dirty tracking
// DEPENDENCIES: react, types (Entry, Step), StepEditor
// ============================================

import { useState, useEffect } from 'react';
import { Entry, Step } from '../types';
import { StepEditor } from './StepEditor';

// ============================================
// PROPS
// ============================================
interface EntryEditProps {
  entry: Entry;
  onSave: (data: {
    essenceText: string;
    essenceShort: string;
    actionName: string;
    benefit: string;
    steps: Step[];
    changeNote: string;
  }) => void;
  onCancel: () => void;
  isPending?: boolean;
  onChange?: (hasChanges: boolean) => void;
}

// ============================================
// COMPONENT: EntryEdit
// ============================================
export function EntryEdit({ entry, onSave, onCancel, isPending = false, onChange }: EntryEditProps) {
  // ============================================
  // LOCAL FORM STATE
  // Initialized from entry prop
  // ============================================
  const [essenceText, setEssenceText] = useState(entry.essenceText);
  const [essenceShort, setEssenceShort] = useState(entry.essenceShort);
  const [actionName, setActionName] = useState(entry.actionName || '');
  const [benefit, setBenefit] = useState(entry.benefit || '');
  const [steps, setSteps] = useState<Step[]>(
    entry.steps ? entry.steps.map((s) => ({ ...s })) : []
  );
  const [changeNote, setChangeNote] = useState('');

  // ============================================
  // DIRTY CHECK
  // PURPOSE: Compares current state with initial entry
  // Notifies parent via onChange callback
  // ============================================
  useEffect(() => {
    const hasChanges =
      essenceText !== entry.essenceText ||
      essenceShort !== entry.essenceShort ||
      actionName !== (entry.actionName || '') ||
      benefit !== (entry.benefit || '') ||
      JSON.stringify(steps) !== JSON.stringify(entry.steps || []) ||
      changeNote !== '';

    onChange?.(hasChanges);
  }, [essenceText, essenceShort, actionName, benefit, steps, changeNote, entry, onChange]);

  // ============================================
  // FORM SUBMISSION
  // Builds payload and passes to parent
  // ============================================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      essenceText,
      essenceShort,
      actionName,
      benefit,
      changeNote,
    };
    // Steps only included for ACTIVE entries
    if (entry.area === 'ACTIVE') {
      data.steps = steps;
    }
    onSave(data);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <form onSubmit={handleSubmit} className="space-y-4 flex flex-col h-full">
      <div className="flex-1 space-y-4">
        {/* Essence Text */}
        <div>
          <label className="label">Essence Text</label>
          <textarea
            value={essenceText}
            onChange={(e) => setEssenceText(e.target.value)}
            className="input"
            rows={4}
            disabled={isPending}
          />
        </div>

        {/* Essence Short */}
        <div>
          <label className="label">Essence Short</label>
          <input
            value={essenceShort}
            onChange={(e) => setEssenceShort(e.target.value)}
            className="input"
            disabled={isPending}
          />
        </div>

        {/* Action Name (only for PASSIVE/ACTIVE) */}
        {entry.actionName !== undefined && (
          <div>
            <label className="label">Action Name</label>
            <input
              maxLength={30}
              value={actionName}
              onChange={(e) => setActionName(e.target.value)}
              className="input"
              disabled={isPending}
            />
          </div>
        )}

        {/* Benefit (only for PASSIVE/ACTIVE) */}
        {entry.benefit !== undefined && (
          <div>
            <label className="label">Benefit</label>
            <input
              value={benefit}
              onChange={(e) => setBenefit(e.target.value)}
              className="input"
              disabled={isPending}
            />
          </div>
        )}

        {/* Steps Editor (only for ACTIVE) */}
        {entry.area === 'ACTIVE' && (
          <StepEditor
            steps={steps}
            onChange={setSteps}
            disabled={isPending}
          />
        )}

        {/* Change Note */}
        <div>
          <label className="label">Change note (optional)</label>
          <textarea
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
            className="input"
            rows={2}
            disabled={isPending}
            placeholder="Why was this entry changed?"
          />
        </div>
      </div>

      {/* Desktop: Save/Cancel Buttons */}
      <div className="hidden sm:flex gap-2 pt-4 border-t border-[var(--border-color)]">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>

      {/* Mobile: Action Buttons (full width) */}
      <div className="sm:hidden shrink-0 pt-4 mt-4 border-t border-[var(--border-color)]">
        <div className="flex gap-3">
          <button type="submit" disabled={isPending} className="btn-primary text-sm px-3 py-2 flex-1">
            {isPending ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary text-sm px-3 py-2 flex-1">
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}