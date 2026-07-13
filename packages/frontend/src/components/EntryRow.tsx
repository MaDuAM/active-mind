// ============================================
// FILE: frontend/src/components/EntryRow.tsx
// PURPOSE: Entry list item with responsive mobile/desktop layouts and favorite toggle
// DEPENDENCIES: react, types (Entry)
// ============================================

import { memo } from 'react';
import { Entry } from '../types';

// ============================================
// PROPS
// ============================================
interface EntryRowProps {
  entry: Entry;
  onClick: (id: number) => void;
  onHover?: (id: number) => void;
  showTopic?: boolean;
  topicName?: string;
  className?: string;
  onToggleFavorite?: (id: number) => void;
  isFavoritePending?: boolean;
}

// ============================================
// COMPONENT: EntryRow
// ============================================
function EntryRowComponent({ 
  entry, 
  onClick,
  onHover, 
  showTopic = false, 
  topicName,
  className = '',
  onToggleFavorite,
  isFavoritePending = false,
}: EntryRowProps) {
  // ============================================
  // COMPUTED VALUES
  // ============================================
  const isActive = entry.area === 'ACTIVE' && entry.steps && entry.steps.length > 0;
  const stepInfo = isActive
    ? `Step ${(entry.currentStepIndex || 0) + 1}/${entry.steps!.length}`
    : '';

  // ============================================
  // STATUS HELPERS
  // ============================================
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

  // ============================================
  // STYLING HELPERS
  // ============================================
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

  // ============================================
  // RENDER
  // ============================================
  return (
    <div
      onClick={() => onClick(entry.id)}
      onMouseEnter={() => onHover?.(entry.id)}
      className={`card cursor-pointer hover:ring-2 hover:ring-offset-0 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 py-2.5 px-4 ${getBorderColor(entry)} ${getRingColor(entry)} ${className}`}
    >
      {/* Mobile Layout: Star + Content vertical */}
      <div className="flex sm:hidden items-start gap-3 w-full">
        {/* Star Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(entry.id);
          }}
          disabled={isFavoritePending}
          className="shrink-0 w-8 h-8 flex items-center justify-center -ml-1 sm:ml-0 mt-0.5 sm:mt-0 transition-colors hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={entry.isFavorite ? 'Remove favorite' : 'Add favorite'}
        >
          <span className={`text-3xl sm:text-xl leading-none transition-colors ${
            entry.isFavorite ? 'text-gold-500' : 'text-[var(--text-muted)] hover:text-gold-400'
          }`}>
            {entry.isFavorite ? '★' : '☆'}
          </span>
        </button>

        {/* Content: Action Name + Metadata */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-[var(--text-primary)] truncate block">
            {entry.actionName || entry.essenceShort}
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-secondary)]">
            {entry.status && (
              <span className="inline-flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(entry.status)}`} />
                {getStatusLabel(entry.status)}
              </span>
            )}
            {isActive && (
              <span className="bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                {stepInfo}
              </span>
            )}
            {showTopic && topicName && (
              <span className="truncate max-w-[100px]">{topicName}</span>
            )}
            <span className="text-[var(--text-muted)]">
              {new Date(entry.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Layout: All in one row */}
      <div className="hidden sm:flex items-center justify-between w-full gap-3">
        {/* Left: Star + Action Name */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(entry.id);
            }}
            disabled={isFavoritePending}
            className="shrink-0 w-6 h-6 flex items-center justify-center transition-colors hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={entry.isFavorite ? 'Remove favorite' : 'Add favorite'}
          >
            <span className={`text-2xl leading-none transition-colors ${
              entry.isFavorite ? 'text-gold-500' : 'text-[var(--text-muted)] hover:text-gold-400'
            }`}>
              {entry.isFavorite ? '★' : '☆'}
            </span>
          </button>
          <span className="text-sm font-medium text-[var(--text-primary)] truncate">
            {entry.actionName || entry.essenceShort}
          </span>
        </div>

        {/* Right: Metadata */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          {/* Step Info (only for ACTIVE entries) */}
          {isActive && (
            <div className="w-[80px] lg:w-[110px] text-left">
              <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                {stepInfo}
              </span>
            </div>
          )}

          {/* Topic Name (optional) */}
          {showTopic && topicName && (
            <div className="hidden md:block w-[80px] lg:w-[130px] text-left">
              <span className="text-xs text-[var(--text-secondary)] truncate block">
                {topicName}
              </span>
            </div>
          )}

          {/* Created Date */}
          <div className="hidden sm:block w-[80px] lg:w-[100px] text-left">
            <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
              {new Date(entry.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Status Badge */}
          {entry.status && (
            <div className="hidden sm:block w-[55px] lg:w-[75px] text-left">
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span className={`w-2 h-2 rounded-full ${getStatusDotColor(entry.status)}`} />
                {getStatusLabel(entry.status)}
              </span>
            </div>
          )}

          {/* Chevron/Arrow indicator */}
          <div className="w-[30px] lg:w-[40px] text-center shrink-0 flex items-center justify-center h-full">
            <span className="text-[var(--text-muted)] text-xl lg:text-2xl font-mono leading-none">›</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const EntryRow = memo(EntryRowComponent);