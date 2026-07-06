// frontend/src/components/ManualTrackPopup.tsx

import { useState, useEffect } from 'react';

interface ManualTrackPopupProps {
  isOpen: boolean;
  onConfirm: (timestamp: string, note: string) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function ManualTrackPopup({
  isOpen,
  onConfirm,
  onCancel,
  isPending = false,
}: ManualTrackPopupProps) {
  const [timestamp, setTimestamp] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTimestamp(new Date().toISOString().slice(0, 16));
      setNote('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
  // ============================================
  // datetime-local input provides format: YYYY-MM-DDTHH:MM
  // Backend expects ISO string with seconds: YYYY-MM-DDTHH:MM:SS
  // Set seconds to 00 for consistency
  // ============================================
    onConfirm(timestamp + ':00', note);
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
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Manual tracking</h3>

        <label className="label mt-4">Date / Time</label>
        <input
          type="datetime-local"
          value={timestamp}
          onChange={(e) => setTimestamp(e.target.value)}
          className="input"
          disabled={isPending}
        />

        <label className="label mt-4">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input"
          rows={3}
          disabled={isPending}
          placeholder="What was done?"
        />
        <div className="text-xs text-[var(--text-muted)] mt-1 text-right">
          {note.length}/500
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={handleCancel} className="btn-secondary" disabled={isPending}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={isPending} className="btn-primary">
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}