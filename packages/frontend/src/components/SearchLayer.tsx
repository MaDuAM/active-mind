// frontend/src/components/SearchLayer.tsx

import { EntryRow } from './EntryRow';
import { Entry, Topic } from '../types';

interface SearchLayerProps {
  entries: Entry[];
  topics: Topic[];
  onSelectEntry: (entryId: number) => void;
  onClose: () => void;
  onHoverEntry?: (entryId: number) => void;
  isLoading?: boolean;
  searchTerm?: string;
  isMobile?: boolean;
}

export function SearchLayer({
  entries,
  topics,
  onSelectEntry,
  onClose,
  onHoverEntry,
  isLoading = false,
  searchTerm = '',
  isMobile = false,
}: SearchLayerProps) {
  // ============================================
  // Helper: Get topic name by ID
  // ============================================
  const getTopicName = (topicId: number) => topics.find((t) => t.id === topicId)?.name || '?';

  // ============================================
  // Mobile: Fullscreen Overlay
  // ============================================
  if (isMobile) {
    // Loading State
    if (isLoading) {
      return (
        <div className="fixed inset-0 z-[200] bg-[var(--bg-card)] flex flex-col animate-in fade-in duration-200">
          <div className="shrink-0 px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between">
            <strong className="text-[var(--text-primary)]">Searching...</strong>
          </div>
          <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
            Loading...
          </div>
          <div className="shrink-0 px-4 py-4 flex justify-center border-t border-[var(--border-color)]">
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
        </div>
      );
    }

    // Empty Results
    if (entries.length === 0) {
      return (
        <div className="fixed inset-0 z-[200] bg-[var(--bg-card)] flex flex-col animate-in fade-in duration-200">
          <div className="shrink-0 px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  className="w-full input rounded-full pl-4 pr-4"
                  placeholder="Search ..."
                  readOnly
                />
              </div>
            </div>
            <div className="mt-2 text-sm text-[var(--text-muted)]">
              No results found for "{searchTerm}"
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
            Try adjusting your search terms.
          </div>
          <div className="shrink-0 px-4 py-4 flex justify-center border-t border-[var(--border-color)]">
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
        </div>
      );
    }

    // Results
    return (
      <div className="fixed inset-0 z-[200] bg-[var(--bg-card)] flex flex-col animate-in fade-in duration-200">
        {/* Header */}
        <div className="shrink-0 px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                className="w-full input rounded-full pl-4 pr-4"
                placeholder="Search ..."
                readOnly
              />
            </div>
          </div>
          <div className="mt-2 text-sm text-[var(--text-primary)]">
            🔍 {entries.length} {entries.length === 1 ? 'result' : 'results'} for "{searchTerm}"
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-2 pb-2">
            {entries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                onClick={(id) => {
                  onSelectEntry(id);
                  onClose();
                }}
                onHover={onHoverEntry}
                showTopic
                topicName={getTopicName(entry.topicId)}
              />
            ))}
          </div>
          {entries.length >= 50 && (
            <div className="mt-3 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border-color)] pt-3">
              Showing first 50 results. Please refine your search.
            </div>
          )}
        </div>

        {/* Close Button (Mobile) */}
        <div className="shrink-0 px-4 py-4 flex justify-center border-t border-[var(--border-color)] bg-[var(--bg-card)]">
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // Desktop: Centered Floating Panel
  // ============================================
  // Loading State
  if (isLoading) {
    return (
      <div className="fixed top-36 left-1/2 -translate-x-1/2 w-[900px] max-w-[90vw] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-card shadow-dropdown overflow-y-auto z-[200] animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-card)] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <strong className="text-[var(--text-primary)]">Searching...</strong>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Empty Results
  if (entries.length === 0) {
    return (
      <div className="fixed top-36 left-1/2 -translate-x-1/2 w-[900px] max-w-[90vw] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-card shadow-dropdown overflow-y-auto z-[200] animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-card)] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <strong className="text-[var(--text-primary)]">No results found</strong>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm text-[var(--text-secondary)]">
            Try adjusting your search terms.
          </p>
        </div>
      </div>
    );
  }

  // Results
  return (
    <div className="fixed top-36 left-1/2 -translate-x-1/2 w-[900px] max-w-[90vw] max-h-[60vh] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-card shadow-dropdown overflow-hidden z-[200] animate-in fade-in slide-in-from-top-4 duration-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-card)] shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <strong className="text-[var(--text-primary)]">
          🔍 {entries.length} {entries.length === 1 ? 'result' : 'results'} for "{searchTerm}"
        </strong>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Results List */}
      <div className="overflow-y-auto p-5 flex-1 relative">
        <div className="space-y-2 pb-2">
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onClick={(id) => {
                onSelectEntry(id);
                onClose();
              }}
              onHover={onHoverEntry}
              showTopic
              topicName={getTopicName(entry.topicId)}
            />
          ))}
        </div>
        {entries.length >= 50 && (
          <div className="mt-3 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border-color)] pt-3">
            Showing first 50 results. Please refine your search.
          </div>
        )}
      </div>

      {/* Fade gradient at bottom (scroll indicator) */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--bg-card)] to-transparent pointer-events-none" />
    </div>
  );
}