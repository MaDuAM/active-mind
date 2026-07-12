// frontend/src/components/EntryView.tsx

import { useState } from 'react';
import { Entry, TrackingType, Status } from '../types';

interface EntryViewProps {
  entry: Entry;
  onEdit: () => void;
  onStatusChange: (newStatus: Status) => void;
  onStepChange: (newStepIndex: number) => void;
  onDelete: () => void;
  onManualTrack: () => void;
  isStatusPending?: boolean;
  isStepPending?: boolean;
}

// ============================================
// Tracking Labels
// Human-readable labels for tracking types
// ============================================
const trackingLabels: Record<TrackingType, string> = {
  CREATION: 'Create',
  STEP_CHANGE: 'Step',
  STATUS_CHANGE: 'Status',
  ENTRY_EDIT: 'Entry',
  MANUAL: 'Manual',
  RESTORE: 'Restore',
};

// ============================================
// Status Badge Component
// Renders colored badge for entry status
// ============================================
function StatusBadge({ status }: { status?: Status }) {
  if (!status) return null;

  const colors = {
    WAITING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  };

  const labels = {
    WAITING: 'Waiting',
    ACTIVE: 'Active',
    PAUSED: 'Paused',
  };

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

// ============================================
// Copy Button Component
// Copies text to clipboard with visual feedback
// Falls back to execCommand if clipboard API fails
// ============================================
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_error) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-[var(--text-muted)] hover:text-gold-500 transition-colors"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <span className="text-xs text-green-500">Copied!</span>
      ) : (
        <svg
          className="w-4 h-4 rotate-90"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="scale(1, -1)"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

// ============================================
// Entry View Component
// Displays entry details in read-only mode
// ============================================
export function EntryView({
  entry,
  onEdit,
  onStatusChange,
  onStepChange,
  onDelete,
  onManualTrack,
  isStatusPending = false,
  isStepPending = false,
}: EntryViewProps) {
  const [activeTypes, setActiveTypes] = useState<TrackingType[]>([]);

  const trackingTypes = [...new Set(entry.trackings?.map((t) => t.trackingType) || [])];
  const filteredTrackings =
    activeTypes.length === 0
      ? entry.trackings || []
      : (entry.trackings || []).filter((t) => activeTypes.includes(t.trackingType));

  // ============================================
  // CSV Export
  // Exports filtered tracking entries as CSV
  // ============================================
  const exportCSV = () => {
    const headers = [
      'tracking_type',
      'timestamp',
      'previous_step',
      'new_step',
      'old_status',
      'new_status',
      'note',
    ];
    const rows = filteredTrackings.map((t) => [
      t.trackingType,
      t.timestamp,
      t.previousStep || '',
      t.newStep || '',
      t.oldStatus || '',
      t.newStatus || '',
      t.note || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tracking_${entry.id}.csv`;
    link.click();
  };

  // ============================================
  // Tracking Filter Toggle
  // ============================================
  const toggleTrackingType = (type: TrackingType) => {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // ============================================
  // Group Trackings by Date
  // Groups entries by Today, Yesterday, or date
  // ============================================
  const groupTrackingsByDate = (trackings: typeof filteredTrackings) => {
    const groups: { [key: string]: typeof trackings } = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    trackings.forEach((t) => {
      const date = new Date(t.timestamp).toDateString();
      let label = date;
      if (date === today) label = 'Today';
      else if (date === yesterday) label = 'Yesterday';
      else label = new Date(t.timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      if (!groups[label]) groups[label] = [];
      groups[label].push(t);
    });
    return groups;
  };

  const groupedTrackings = groupTrackingsByDate(filteredTrackings);
  const trackingCount = entry.trackings?.length || 0;

  return (
    <div className="space-y-4">
      {/* ============================================ */}
      {/* Status Badge */}
      {/* ============================================ */}
      {entry.status && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
          <StatusBadge status={entry.status} />
        </div>
      )}

      {/* ============================================ */}
      {/* Essence Card */}
      {/* ============================================ */}
      <div className="card space-y-3 max-h-[40vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Essence
          </span>
          <CopyButton text={entry.essenceText} />
        </div>
        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
          {entry.essenceText}
        </p>
      </div>

      {/* ============================================ */}
      {/* Essence Short Card */}
      {/* ============================================ */}
      <div className="card space-y-1">
        <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Short
        </span>
        <p className="text-sm text-[var(--text-primary)]">{entry.essenceShort}</p>
      </div>

      {entry.benefit && (
        <div className="card space-y-1 border-gold-500/20 bg-gold-50/10">
          <span className="text-[10px] font-medium text-gold-500 uppercase tracking-wider">
            ✨ Benefit
          </span>
          <p className="text-sm text-[var(--text-primary)]">{entry.benefit}</p>
        </div>
      )}

      {/* ============================================ */}
      {/* Steps Section (only for ACTIVE entries) */}
      {/* ============================================ */}
      {entry.area === 'ACTIVE' && entry.steps && entry.steps.length > 0 && (
        <div className="card space-y-2">
          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Steps
          </span>
          <ol className="list-decimal list-inside space-y-0.5 text-sm text-[var(--text-primary)]">
            {entry.steps.map((step, i) => (
              <li
                key={i}
                className={i === entry.currentStepIndex ? 'font-semibold text-gold-500' : 'text-[var(--text-secondary)]'}
              >
                {step.description}
              </li>
            ))}
          </ol>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() =>
                onStepChange(Math.max(0, (entry.currentStepIndex || 0) - 1))
              }
              disabled={isStepPending || (entry.currentStepIndex || 0) === 0}
              className="btn-secondary text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ◀ Previous
            </button>
            <button
              onClick={() =>
                onStepChange(
                  Math.min(
                    (entry.steps?.length || 1) - 1,
                    (entry.currentStepIndex || 0) + 1
                  )
                )
              }
              disabled={
                isStepPending ||
                (entry.currentStepIndex || 0) >= (entry.steps?.length || 1) - 1
              }
              className="btn-secondary text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next ▶
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* Actions */}
      {/* ============================================ */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--border-color)]">
        <button onClick={onEdit} className="btn-secondary text-sm px-3 py-1.5 hover:bg-gold-500 hover:text-white">
          Edit
        </button>
        {entry.area !== 'KNOWLEDGE' && (
          <>
            {entry.status === 'WAITING' && (
              <button
                onClick={() => onStatusChange('ACTIVE')}
                disabled={isStatusPending}
                className="btn-primary text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Status → Active
              </button>
            )}
            {entry.status === 'ACTIVE' && (
              <button
                onClick={() => onStatusChange('PAUSED')}
                disabled={isStatusPending}
                className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Status → Pause
              </button>
            )}
            {entry.status === 'PAUSED' && (
              <button
                onClick={() => onStatusChange('ACTIVE')}
                disabled={isStatusPending}
                className="btn-primary text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Status → Active
              </button>
            )}
          </>
        )}
        <button
          onClick={onManualTrack}
          className="btn-secondary text-sm px-3 py-1.5 hover:bg-gold-500 hover:text-white"
        >
          Manual tracking
        </button>
        <button
          onClick={onDelete}
          className="text-sm px-3 py-1.5 rounded-button font-medium transition-all cursor-pointer border border-error text-error hover:bg-error hover:text-white"
        >
          Delete
        </button>
      </div>

      {/* ============================================ */}
      {/* Tracking Log */}
      {/* ============================================ */}
      {entry.trackings && entry.trackings.length > 0 && (
        <div className="pt-4 border-t border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Tracking Log</h3>

          {/* Filter Controls */}
          <div className="flex items-center gap-4 mb-3 overflow-x-auto">
            {trackingTypes.map((type) => (
              <label key={type} className="text-sm flex items-center gap-1.5 text-[var(--text-secondary)] cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={activeTypes.includes(type)}
                  onChange={() => toggleTrackingType(type)}
                />
                {trackingLabels[type]}
              </label>
            ))}
            <button onClick={exportCSV} className="btn-secondary text-sm ml-auto hover:bg-gold-500 hover:text-white whitespace-nowrap">
              CSV Export
            </button>
          </div>

          {/* Tracking Entries */}
          <div className="card p-3 max-h-60 overflow-y-auto space-y-1.5 font-mono text-xs text-[var(--text-secondary)]">
            {Object.entries(groupedTrackings).map(([dateLabel, trackings]) => (
              <div key={dateLabel}>
                <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider pt-1 pb-0.5 border-b border-[var(--border-color)] mb-1">
                  {dateLabel}
                </div>
                {trackings.map((t) => {
                  let mainText = trackingLabels[t.trackingType];
                  if (t.trackingType === 'STATUS_CHANGE' && t.oldStatus && t.newStatus) {
                    mainText = `${t.oldStatus} → ${t.newStatus}`;
                  }
                  if (t.trackingType === 'STEP_CHANGE' && t.previousStep && t.newStep) {
                    mainText = `“${t.previousStep}” → “${t.newStep}”`;
                  }

                  const extraText = t.note || '';

                  return (
                    <div key={t.id} className="flex items-start gap-3 py-0.5 border-b border-[var(--border-color)] border-opacity-30 last:border-0">
                      <span className="text-[var(--text-muted)] whitespace-nowrap w-28 shrink-0">
                        {new Date(t.timestamp).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        {' '}
                        {new Date(t.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-xs font-medium text-gold-500 w-16 shrink-0">
                        {trackingLabels[t.trackingType]}
                      </span>
                      <span className="text-[var(--text-primary)] truncate">
                        {mainText}
                      </span>
                      {extraText && (
                        <span className="text-[var(--text-muted)] truncate">
                          — {extraText}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-2 text-xs text-[var(--text-muted)] text-right">
            {trackingCount} {trackingCount === 1 ? 'tracking entry' : 'tracking entries'}
          </div>
        </div>
      )}
    </div>
  );
}