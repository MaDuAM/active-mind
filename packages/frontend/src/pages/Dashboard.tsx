// ============================================
// FILE: frontend/src/pages/Dashboard.tsx
// PURPOSE: Dashboard page - displays entries grouped by status/area sections
// DEPENDENCIES: react, tanstack/react-query, custom hooks, components
// ============================================

import { useState, lazy, Suspense, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useEntriesBySection, useTopics, useToggleFavorite } from '../hooks';
import { useSectionState } from '../hooks/useSectionState';
import { EntrySection } from '../components/EntrySection';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useLoadingDebounce } from '../hooks/useLoadingDebounce';
import { SectionKey } from '../hooks/useSectionState';

// ============================================
// LAZY LOADING
// PURPOSE: Reduces initial bundle size
// ============================================
const NewEntryForm = lazy(() => import('../components/NewEntryForm'));

// ============================================
// PROPS
// ============================================
interface DashboardProps {
  onOpenEntry: (id: number) => void;
  showNewEntryForm: boolean;
  setShowNewEntryForm: (value: boolean) => void;
}

// ============================================
// COMPONENT: Dashboard
// ============================================
export function Dashboard({ onOpenEntry, showNewEntryForm, setShowNewEntryForm }: DashboardProps) {
  // ============================================
  // FAVORITES FILTER STATE
  // PURPOSE: Tracks which sections are filtered to show only favorites
  // ============================================
  const [favoritesFilter, setFavoritesFilter] = useState<Record<SectionKey, boolean>>({
    active: false,
    passive: false,
    waiting: false,
    paused: false,
    knowledge: false,
  });

  const queryClient = useQueryClient();

  // ============================================
  // DATA FETCHING (5 separate queries per section)
  // ============================================
  const { data: sectionData, isLoading: sectionLoading } = useEntriesBySection(
    undefined, // topicId = undefined für Dashboard (alle Topics)
    true
  );

  const { data: topics = [], isLoading: topicsLoading } = useTopics(true);
  const toggleFavoriteMutation = useToggleFavorite();

  // ============================================
  // COMPUTED DATA: Group entries by section
  // ============================================
  const isLoading = sectionLoading || topicsLoading;
  const activeEntries = sectionData?.active || [];
  const passiveEntries = sectionData?.passive || [];
  const waitingEntries = sectionData?.waiting || [];
  const pausedEntries = sectionData?.paused || [];
  const knowledgeEntries = sectionData?.knowledge || [];

  const showLoading = useLoadingDebounce(isLoading, 200);

  const sections = useMemo(() => ({
    active: activeEntries,
    passive: passiveEntries,
    waiting: waitingEntries,
    paused: pausedEntries,
    knowledge: knowledgeEntries,
    activeCount: activeEntries.length,
    passiveCount: passiveEntries.length,
    knowledgeCount: knowledgeEntries.length,
  }), [activeEntries, passiveEntries, waitingEntries, pausedEntries, knowledgeEntries]);

  // ============================================
  // SECTION EXPANSION STATE
  // ============================================
  const { expanded, toggleSection } = useSectionState({
    initialExpanded: { active: true },
  });

  // ============================================
  // MEMOIZED CALLBACKS
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
    queryClient.invalidateQueries({ queryKey: ['entries-by-section'] });
  }, [setShowNewEntryForm, queryClient]);

  const handleNewEntryCancel = useCallback(() => {
    setShowNewEntryForm(false);
  }, [setShowNewEntryForm]);

  // ============================================
  // FAVORITES HANDLERS
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
  // SKELETON LOADING STATE
  // ============================================
  const hasData = activeEntries.length > 0 || passiveEntries.length > 0;

  if (isLoading && !hasData) {
    return <LoadingOverlay message="Loading entries..." />;
  }

  if (showLoading && hasData) {
    return <LoadingOverlay message="Loading entries..." />;
  }

  // ============================================
  // RENDER
  // ============================================
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
        </div>
      </div>

      {/* Active Actions */}
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

      {/* Passive Actions */}
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

      {/* Waiting Actions (only if entries exist) */}
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

      {/* Paused (only if entries exist) */}
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

      {/* Footer Stats */}
      {activeEntries.length > 0 || passiveEntries.length > 0 || knowledgeEntries.length > 0 ? (
        <div className="py-4 text-center text-sm text-[var(--text-muted)] space-y-1">
          <div className="flex justify-center gap-4 text-xs">
            <span>⚡ Active: {sections.activeCount}</span>
            <span>💡 Passive: {sections.passiveCount}</span>
            <span>📚 Knowledge: {sections.knowledgeCount}</span>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center text-sm text-[var(--text-muted)]">
          No entries yet. Create your first entry!
        </div>
      )}
    </div>
  );
}