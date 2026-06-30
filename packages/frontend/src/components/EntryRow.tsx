// frontend/src/components/EntryRow.tsx

import { memo } from 'react';
import { Entry } from '../types';

interface EntryRowProps {
  entry: Entry;
  onClick: (id: number) => void;
  onHover?: (id: number) => void;
  showTopic?: boolean;
  topicName?: string;
  className?: string;
}

function EntryRowComponent({ 
  entry, 
  onClick,
  onHover, 
  showTopic = false, 
  topicName,
  className = '',
}: EntryRowProps) {
  const isActive = entry.area === 'ACTIVE' && entry.steps && entry.steps.length > 0;
  const stepInfo = isActive
    ? `Step ${(entry.currentStepIndex || 0) + 1}/${entry.steps!.length}`
    : '';

  const getStatusLabel = (status?: string) => {
    if (!status) return '';
    switch (status) {
      case 'WAITING': return 'Waiting';
      case 'ACTIVE': return 'Active';
      case 'PAUSED': return 'Paused';
      default: return status;
    }
  };

  const getStatusDotColor = (status?: string) => {
    if (!status) return 'bg-[var(--text-muted)]';
    switch (status) {
      case 'WAITING':
        return 'bg-blue-500';
      case 'ACTIVE':
        return 'bg-green-500';
      case 'PAUSED':
        return 'bg-amber-500';
      default:
        return 'bg-[var(--text-muted)]';
    }
  };

  const getBorderColor = (entry: Entry) => {
    if (entry.status === 'WAITING') {
      return 'border-blue-200 dark:border-blue-400/40';
    }
    if (entry.status === 'PAUSED') {
      return 'border-amber-200/50 dark:border-amber-500/30';
    }
    switch (entry.area) {
      case 'KNOWLEDGE':
        return 'border-amber-700/30 dark:border-amber-500/50';
      case 'ACTIVE':
        return 'border-green-200 dark:border-green-500/40';
      case 'PASSIVE':
        return 'border-amber-200 dark:border-amber-500/40';
      default:
        return 'border-[var(--border-color)]';
    }
  };

  const getRingColor = (entry: Entry) => {
    if (entry.status === 'WAITING') {
      return 'ring-blue-200 dark:ring-blue-400/30';
    }
    if (entry.status === 'PAUSED') {
      return 'ring-amber-200/50 dark:ring-amber-500/20';
    }
    switch (entry.area) {
      case 'KNOWLEDGE':
        return 'ring-amber-700/20 dark:ring-amber-500/40';
      case 'ACTIVE':
        return 'ring-green-200 dark:ring-green-500/30';
      case 'PASSIVE':
        return 'ring-amber-200 dark:ring-amber-500/30';
      default:
        return 'ring-[var(--border-color)]';
    }
  };

  return (
    <div
      onClick={() => onClick(entry.id)}
      onMouseEnter={() => onHover?.(entry.id)}
      className={`card cursor-pointer flex items-center justify-between gap-4 hover:ring-2 hover:ring-offset-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 py-2.5 px-4 ${getBorderColor(entry)} ${getRingColor(entry)} ${className}`}
    >
      {/* Linke Seite: Action Name (flexibel) */}
      <span className="text-sm font-medium text-[var(--text-primary)] truncate flex-1 min-w-0">
        {entry.actionName || entry.essenceShort}
      </span>

      {/* Rechte Seite: Feste Spalten für saubere Kante */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Step-Box (nur bei ACTIVE) – Tablet+Desktop */}
        {isActive && (
          <div className="hidden md:block w-[110px] text-left">
            <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
              {stepInfo}
            </span>
          </div>
        )}

        {/* Benefit-Box (optional) – nur Desktop */}
        {entry.benefit && (
          <div className="hidden lg:block w-[60px] text-left">
            <span className="text-xs text-gold-500 bg-gold-50/50 px-2 py-0.5 rounded-full truncate block">
              ✨
            </span>
          </div>
        )}

        {/* Topic-Box – ab Handy-Querformat */}
        {showTopic && topicName && (
          <div className="hidden sm:block w-[130px] text-left">
            <span className="text-xs text-[var(--text-secondary)] truncate block">
              {topicName}
            </span>
          </div>
        )}

        {/* Datum-Box – Tablet+Desktop */}
        <div className="hidden md:block w-[100px] text-left">
          <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
            {new Date(entry.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Status-Box – ab Handy-Querformat */}
        {entry.status && (
          <div className="hidden sm:block w-[75px] text-left">
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <span className={`w-2 h-2 rounded-full ${getStatusDotColor(entry.status)}`} />
              {getStatusLabel(entry.status)}
            </span>
          </div>
        )}

        {/* Pfeil-Box – immer sichtbar */}
        <div className="w-[40px] text-center shrink-0 flex items-center justify-center h-full">
          <span className="text-[var(--text-muted)] text-2xl font-mono leading-none">›</span>
        </div>
      </div>
    </div>
  );
}

export const EntryRow = memo(EntryRowComponent);