// ============================================
// FILE: frontend/src/components/EntrySection.tsx
// PURPOSE: Reusable section component for displaying grouped entries with favorites filter
// DEPENDENCIES: react, types (Entry), EntryRow, SectionKey
// ============================================

import { Entry } from '../types';
import { EntryRow } from './EntryRow';
import { SectionKey } from '../hooks/useSectionState';

// ============================================
// PROPS
// ============================================
interface EntrySectionProps {
  section: SectionKey;
  title: string;
  emptyIcon: string;
  emptyMessage: string;
  emptySubMessage?: string;
  titleColor: string;
  entries: Entry[];
  isExpanded: boolean;
  onToggle: () => void;
  onEntryClick: (id: number) => void;
  onEntryHover?: (id: number) => void;
  showTopic?: boolean;
  getTopicName?: (topicId: number) => string;
  className?: string;
  showFavoritesOnly: boolean;
  onToggleFavorites: (section: SectionKey) => void;
  onToggleFavorite?: (id: number) => void;
  isFavoritePending?: boolean;
}

// ============================================
// COMPONENT: EntrySection
// ============================================
export function EntrySection({
  title,
  emptyIcon,
  emptyMessage,
  emptySubMessage = 'Create an entry to get started',
  titleColor,
  entries,
  isExpanded,
  onToggle,
  onEntryClick,
  onEntryHover,
  showTopic = false,
  getTopicName,
  className = '',
  showFavoritesOnly,
  onToggleFavorites,
  onToggleFavorite,
  isFavoritePending = false,
  section,
}: EntrySectionProps) {
  // Filter entries by favorite if enabled
  const filteredEntries = showFavoritesOnly 
    ? entries.filter(e => e.isFavorite) 
    : entries;
  const isEmpty = filteredEntries.length === 0;

  return (
    <section id={`section-${section}`} className={className}>
      {/* Header */}
      <div
        className="flex items-center justify-between mb-3 cursor-pointer"
        onClick={onToggle}
      >
        <h2 className={`text-sm font-semibold uppercase tracking-wider ${titleColor}`}>
          {title} ({filteredEntries.length}/{entries.length})
        </h2>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {/* Favorites Toggle - only show if entries exist */}
          {entries.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
              <span className="text-xl leading-none text-gold-500">
                ★
              </span>
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={() => onToggleFavorites(section)}
                className="w-3.5 h-3.5 accent-gold-500 cursor-pointer"
              />
            </label>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors text-xl"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <span className="-translate-y-0.5">
              {isExpanded ? '⏶' : '⏷'}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <>
          {isEmpty ? (
            <div className="flex items-center gap-3 py-3 text-[var(--text-muted)]">
              <span className="text-xl">{emptyIcon}</span>
              <div>
                <p className="text-sm font-medium">
                  {showFavoritesOnly && entries.length > 0 
                    ? 'No favorites in this section' 
                    : emptyMessage}
                </p>
                <p className="text-xs opacity-60">
                  {showFavoritesOnly && entries.length > 0
                    ? 'Star entries to see them here'
                    : emptySubMessage}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onClick={onEntryClick}
                  onHover={onEntryHover}
                  showTopic={showTopic}
                  topicName={getTopicName?.(entry.topicId)}
                  onToggleFavorite={onToggleFavorite}
                  isFavoritePending={isFavoritePending}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}