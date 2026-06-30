// frontend/src/components/EntryEdit.tsx

import { useState, useEffect } from 'react';
import { Entry, Step } from '../types';
import { StepEditor } from './StepEditor';

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

export function EntryEdit({ entry, onSave, onCancel, isPending = false, onChange }: EntryEditProps) {
  const [essenceText, setEssenceText] = useState(entry.essenceText);
  const [essenceShort, setEssenceShort] = useState(entry.essenceShort);
  const [actionName, setActionName] = useState(entry.actionName || '');
  const [benefit, setBenefit] = useState(entry.benefit || '');
  const [steps, setSteps] = useState<Step[]>(
    entry.steps ? entry.steps.map((s) => ({ ...s })) : []
  );
  const [changeNote, setChangeNote] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      essenceText,
      essenceShort,
      actionName,
      benefit,
      changeNote,
    };
    if (entry.area === 'ACTIVE') {
      data.steps = steps;
    }
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 flex flex-col h-full">
      <div className="flex-1 space-y-4">
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

        <div>
          <label className="label">Essence Short</label>
          <input
            value={essenceShort}
            onChange={(e) => setEssenceShort(e.target.value)}
            className="input"
            disabled={isPending}
          />
        </div>

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

        {entry.area === 'ACTIVE' && (
          <StepEditor
            steps={steps}
            onChange={setSteps}
            disabled={isPending}
          />
        )}

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

      {/* Mobile: Action Buttons */}
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