// frontend/src/components/TrackingPopup.tsx

import { useState, useEffect } from 'react';

interface TrackingPopupProps {
  isOpen: boolean;
  onConfirm: (note: string) => void;
  onCancel: () => void;
  title?: string;
  noteLabel?: string;
  isPending?: boolean;
  initialNote?: string;
}

export function TrackingPopup({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Note the change',
  noteLabel = 'Note',
  isPending = false,
  initialNote = '',
}: TrackingPopupProps) {
  const [note, setNote] = useState(initialNote);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setNote(initialNote);
    }
  }, [isOpen, initialNote]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(note);
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <div
        className="bg-[var(--bg-card)] rounded-card shadow-card p-6 max-w-sm w-full border border-[var(--border-color)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        <label className="label mt-4">{noteLabel}</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input"
          rows={3}
          disabled={isPending}
          placeholder="Why was this change made?"
          autoFocus
        />
        <div className="text-xs text-[var(--text-muted)] mt-1 text-right">
          {note.length}/500
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={handleCancel} className="btn-secondary" disabled={isPending}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isPending} className="btn-primary">
            {isPending ? '...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}