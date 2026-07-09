// frontend/src/pages/Dashboard.tsx

import { useState, lazy, Suspense, useEffect, useMemo, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { usePaginatedEntries, useTopics, useToggleFavorite } from '../hooks';
import { useSectionState } from '../hooks/useSectionState';
import { EntrySection } from '../components/EntrySection';
import { Entry } from '../types';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useLoadingDebounce } from '../hooks/useLoadingDebounce';
import { SectionKey } from '../hooks/useSectionState';

const NewEntryForm = lazy(() => import('../components/NewEntryForm'));

interface DashboardProps {
  onOpenEntry: (id: number) => void;
  showNewEntryForm: boolean;
  setShowNewEntryForm: (value: boolean) => void;
}

export function Dashboard({ onOpenEntry, showNewEntryForm, setShowNewEntryForm }: DashboardProps) {
  const [limit] = useState(25);
  
  // ============================================
  // Favorites Filter State
  // Tracks which sections are filtered to show only favorites
  // ============================================
  const [favoritesFilter, setFavoritesFilter] = useState<Record<SectionKey, boolean>>({
    active: false,
    passive: false,
    waiting: false,
    paused: false,
    knowledge: false,
  });

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // ============================================
  // Data Fetching
  // ============================================
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: entriesLoading,
    refetch: refetchEntries,
  } = usePaginatedEntries({ limit }, true);

  const { data: topics = [], isLoading: topicsLoading } = useTopics(true);
  const toggleFavoriteMutation = useToggleFavorite();

  const isLoading = entriesLoading || topicsLoading;
  const showLoading = useLoadingDebounce(isLoading, 200);
  const allEntries = data?.pages.flatMap((page) => page.data) || [];

  // ============================================
  // Computed Data: Group entries by section
  // ============================================
  const sections = useMemo(() => {
    const active = allEntries.filter(
      (e: Entry) => e.area === 'ACTIVE' && e.status === 'ACTIVE'
    );
    const passive = allEntries.filter(
      (e: Entry) => e.area === 'PASSIVE' && e.status === 'ACTIVE'
    );
    const waiting = allEntries.filter(
      (e: Entry) => e.status === 'WAITING' && e.area !== 'KNOWLEDGE'
    );
    const pausedActive = allEntries.filter(
      (e: Entry) => e.area === 'ACTIVE' && e.status === 'PAUSED'
    );
    const pausedPassive = allEntries.filter(
      (e: Entry) => e.area === 'PASSIVE' && e.status === 'PAUSED'
    );
    const paused = [...pausedActive, ...pausedPassive];
    const knowledge = allEntries.filter((e: Entry) => e.area === 'KNOWLEDGE');

    return {
      active,
      passive,
      waiting,
      paused,
      knowledge,
      activeCount: active.length,
      passiveCount: passive.length,
      knowledgeCount: knowledge.length,
    };
  }, [allEntries]);

  // ============================================
  // Section Expansion State
  // ============================================
  const { expanded, allExpanded, toggleSection, toggleAll } = useSectionState({
    autoExpand: true,
    getSectionHasItems: () => ({
      active: sections.active.length > 0,
      passive: sections.passive.length > 0,
      waiting: sections.waiting.length > 0,
      paused: sections.paused.length > 0,
      knowledge: sections.knowledge.length > 0,
    }),
  });

  // ============================================
  // Memoized Callbacks
  // ============================================
  const getTopicName = useCallback(
    (topicId: number) => topics.find((t) => t.id === topicId)?.name || '?',
    [topics]
  );

  const handleEntryClick = useCallback(
    (id: number) => onOpenEntry(id),
    [onOpenEntry]
  );

  const handleNewEntrySuccess = useCallback(() => {
    setShowNewEntryForm(false);
    refetchEntries();
  }, [setShowNewEntryForm, refetchEntries]);

  const handleNewEntryCancel = useCallback(() => {
    setShowNewEntryForm(false);
  }, [setShowNewEntryForm]);

  // ============================================
  // Favorites Handlers
  // ============================================
  const handleToggleFavoritesFilter = useCallback((section: SectionKey) => {
    setFavoritesFilter(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleToggleFavorite = useCallback((id: number) => {
    toggleFavoriteMutation.mutate(id);
  }, [toggleFavoriteMutation]);

  // ============================================
  // Infinite Scroll
  // ============================================
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================
  // Skeleton Loading State
  // ============================================
  if (showLoading && allEntries.length === 0) {
    return <LoadingOverlay message="Loading entries..." />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* New Entry Form Overlay */}
      {showNewEntryForm && (
        <Suspense fallback={<div className="p-6 text-[var(--text-secondary)]">Loading Form...</div>}>
          <NewEntryForm
            onSuccess={handleNewEntrySuccess}
            onCancel={handleNewEntryCancel}
          />
        </Suspense>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
        <h1 className="text-2xl font-semibold text-gold-500 tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewEntryForm(true)}
            className="hidden sm:inline-block btn-primary text-sm px-3 py-1.5 w-28"
          >
            + New Entry
          </button>
          <button onClick={toggleAll} className="btn-secondary text-sm px-3 py-1.5 w-28">
            {allExpanded === 'all' ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* Active Actions */}
      {/* ============================================ */}
      <EntrySection
        section="active"
        title="Active Actions"
        emptyIcon="⚡"
        emptyMessage="No active actions yet"
        titleColor="text-green-400 dark:text-green-300"
        entries={sections.active}
        isExpanded={expanded.active}
        onToggle={() => toggleSection('active')}
        onEntryClick={handleEntryClick}
        showTopic
        getTopicName={getTopicName}
        className="mb-3"
        showFavoritesOnly={favoritesFilter.active}
        onToggleFavorites={handleToggleFavoritesFilter}
        onToggleFavorite={handleToggleFavorite}
        isFavoritePending={toggleFavoriteMutation.isPending}
      />

      <hr className="border-[var(--border-color)] my-6" />

      {/* ============================================ */}
      {/* Passive Actions */}
      {/* ============================================ */}
      <EntrySection
        section="passive"
        title="Passive Actions"
        emptyIcon="💡"
        emptyMessage="No passive actions yet"
        titleColor="text-amber-400 dark:text-amber-300"
        entries={sections.passive}
        isExpanded={expanded.passive}
        onToggle={() => toggleSection('passive')}
        onEntryClick={handleEntryClick}
        showTopic
        getTopicName={getTopicName}
        className="mb-3"
        showFavoritesOnly={favoritesFilter.passive}
        onToggleFavorites={handleToggleFavoritesFilter}
        onToggleFavorite={handleToggleFavorite}
        isFavoritePending={toggleFavoriteMutation.isPending}
      />

      {/* ============================================ */}
      {/* Waiting Actions (only if entries exist) */}
      {/* ============================================ */}
      {sections.waiting.length > 0 && (
        <>
          <hr className="border-[var(--border-color)] my-6" />
          <EntrySection
            section="waiting"
            title="Waiting Actions"
            emptyIcon="⏳"
            emptyMessage="No waiting actions"
            titleColor="text-blue-400 dark:text-blue-300"
            entries={sections.waiting}
            isExpanded={expanded.waiting}
            onToggle={() => toggleSection('waiting')}
            onEntryClick={handleEntryClick}
            showTopic
            getTopicName={getTopicName}
            className="mb-3"
            showFavoritesOnly={favoritesFilter.waiting}
            onToggleFavorites={handleToggleFavoritesFilter}
            onToggleFavorite={handleToggleFavorite}
            isFavoritePending={toggleFavoriteMutation.isPending}
          />
        </>
      )}

      {/* ============================================ */}
      {/* Paused (only if entries exist) */}
      {/* ============================================ */}
      {sections.paused.length > 0 && (
        <>
          <hr className="border-[var(--border-color)] my-6" />
          <EntrySection
            section="paused"
            title="Paused"
            emptyIcon="⏸️"
            emptyMessage="No paused actions"
            titleColor="text-[var(--text-muted)]"
            entries={sections.paused}
            isExpanded={expanded.paused}
            onToggle={() => toggleSection('paused')}
            onEntryClick={handleEntryClick}
            showTopic
            getTopicName={getTopicName}
            className="opacity-70 mb-3"
            showFavoritesOnly={favoritesFilter.paused}
            onToggleFavorites={handleToggleFavoritesFilter}
            onToggleFavorite={handleToggleFavorite}
            isFavoritePending={toggleFavoriteMutation.isPending}
          />
        </>
      )}

      {/* ============================================ */}
      {/* Infinite Scroll Trigger */}
      {/* ============================================ */}
      {hasNextPage && (
        <div ref={ref} className="py-6 text-center">
          {isFetchingNextPage ? (
            <div className="space-y-2 py-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-[var(--bg-secondary)] rounded" />
              ))}
            </div>
          ) : (
            <div className="text-sm text-[var(--text-muted)]">Scroll for more</div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* Footer Stats */}
      {/* ============================================ */}
      {!hasNextPage && allEntries.length > 0 && (
        <div className="py-4 text-center text-sm text-[var(--text-muted)] space-y-1">
          <div>{allEntries.length} entries loaded</div>
          <div className="flex justify-center gap-4 text-xs">
            <span>⚡ Active: {sections.activeCount}</span>
            <span>💡 Passive: {sections.passiveCount}</span>
            <span>📚 Knowledge: {sections.knowledgeCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}