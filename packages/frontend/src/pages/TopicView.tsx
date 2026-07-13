// frontend/src/pages/TopicView.tsx

import { useState, Suspense, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePaginatedEntries, useTopics, useDeleteTopic, useToggleFavorite } from '../hooks';
import { useSectionState } from '../hooks/useSectionState';
import { EntrySection } from '../components/EntrySection';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useLoadingDebounce } from '../hooks/useLoadingDebounce';
import { SectionKey } from '../hooks/useSectionState';
import NewEntryForm from '../components/NewEntryForm';

interface TopicViewProps {
  topicId: number;
  onOpenEntry: (id: number) => void;
  onTopicDeleted: () => void;
  showNewEntryForm: boolean;
  setShowNewEntryForm: (value: boolean) => void;
  isVisible?: boolean;
}

export default function TopicView({
  topicId,
  onOpenEntry,
  onTopicDeleted,
  showNewEntryForm,
  setShowNewEntryForm,
}: TopicViewProps) {

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const queryClient = useQueryClient();

  // 5 separate Queries (gefiltert nach topicId)
  const { data: activeData, isLoading: activeLoading } = usePaginatedEntries(
    { topicId, area: 'ACTIVE', status: 'ACTIVE', limit: 100 },
    !!topicId
  );
  const { data: passiveData, isLoading: passiveLoading } = usePaginatedEntries(
    { topicId, area: 'PASSIVE', status: 'ACTIVE', limit: 100 },
    !!topicId
  );
  const { data: waitingData, isLoading: waitingLoading } = usePaginatedEntries(
    { topicId, status: 'WAITING', limit: 100 },
    !!topicId
  );
  const { data: pausedData, isLoading: pausedLoading } = usePaginatedEntries(
    { topicId, status: 'PAUSED', limit: 100 },
    !!topicId
  );
  const { data: knowledgeData, isLoading: knowledgeLoading } = usePaginatedEntries(
    { topicId, area: 'KNOWLEDGE', limit: 100 },
    !!topicId
  );

  const { data: topics = [], isLoading: topicsLoading } = useTopics(true);
  const deleteTopicMutation = useDeleteTopic();
  const toggleFavoriteMutation = useToggleFavorite();

  const isLoading = activeLoading || passiveLoading || waitingLoading || pausedLoading || knowledgeLoading || topicsLoading;
  const activeEntries = activeData?.pages.flatMap((page) => page.data) || [];
  const passiveEntries = passiveData?.pages.flatMap((page) => page.data) || [];
  const waitingEntries = waitingData?.pages.flatMap((page) => page.data) || [];
  const pausedEntries = pausedData?.pages.flatMap((page) => page.data) || [];
  const knowledgeEntries = knowledgeData?.pages.flatMap((page) => page.data) || [];

  const { data: trashData } = usePaginatedEntries(
    { topicId, deletedOnly: true, limit: 1 },
    !!topicId
  );
  const trashCount = trashData?.pages?.[0]?.pagination?.total || 0;

  const showLoading = useLoadingDebounce(isLoading, 200);

  // ============================================
  // Computed Data: Group entries by section
  // ============================================
  const sections = useMemo(() => ({
    active: activeEntries,
    passive: passiveEntries,
    waiting: waitingEntries,
    paused: pausedEntries,
    knowledge: knowledgeEntries,
    total: activeEntries.length + passiveEntries.length + waitingEntries.length + pausedEntries.length + knowledgeEntries.length,
  }), [activeEntries, passiveEntries, waitingEntries, pausedEntries, knowledgeEntries]);

  // ============================================
  // Section Expansion State
  // ============================================
  const { expanded, toggleSection } = useSectionState({
    initialExpanded: { active: true },
  });

  // ============================================
  // Memoized Callbacks
  // ============================================
  const handleEntryClick = useCallback(
    (id: number) => onOpenEntry(id),
    [onOpenEntry]
  );

  const handleNewEntrySuccess = useCallback(() => {
    setShowNewEntryForm(false);
    queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
  }, [setShowNewEntryForm, queryClient]);

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
  // Handlers
  // ============================================
  const topicName = topics.find((t) => t.id === topicId)?.name || 'Unbekannt';

  const handleDeleteTopic = async () => {
    try {
      await deleteTopicMutation.mutateAsync(topicId);
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
      onTopicDeleted();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Can not delete Topic Block')) {
        alert(error.message);
      }
    }
    setShowDeleteConfirm(false);
  };

  // ============================================
  // Skeleton Loading State
  // ============================================
  if (showLoading && sections.total === 0) {
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
        <div>
          <h1 className="text-2xl font-semibold text-gold-500 tracking-tight">{topicName}</h1>
          {sections.total === 0 && trashCount === 0 && (
            <p className="text-sm text-[var(--text-muted)] mt-1">(empty topic block)</p>
          )}
          {sections.total === 0 && trashCount > 0 && (
            <p className="text-sm text-[var(--text-muted)] mt-1">
              (empty – {trashCount} Entries in Removed Entries)
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {sections.total === 0 && trashCount === 0 && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteTopicMutation.isPending}
              className="btn-danger text-sm px-3 py-1.5"
            >
              {deleteTopicMutation.isPending ? 'Deleting...' : 'Delete Topic Block'}
            </button>
          )}
          <button
            onClick={() => setShowNewEntryForm(true)}
            className="hidden sm:inline-block btn-primary text-sm px-3 py-1.5 w-28"
          >
            + New Entry
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* 1. Active */}
      {/* ============================================ */}
      <EntrySection
        section="active"
        title="Active"
        emptyIcon="⚡"
        emptyMessage="No active actions yet"
        titleColor="text-green-400 dark:text-green-300"
        entries={sections.active}
        isExpanded={expanded.active}
        onToggle={() => toggleSection('active')}
        onEntryClick={handleEntryClick}
        className="mb-3"
        showFavoritesOnly={favoritesFilter.active}
        onToggleFavorites={handleToggleFavoritesFilter}
        onToggleFavorite={handleToggleFavorite}
        isFavoritePending={toggleFavoriteMutation.isPending}
      />

      <hr className="border-[var(--border-color)] my-6" />

      {/* ============================================ */}
      {/* 2. Passive */}
      {/* ============================================ */}
      <EntrySection
        section="passive"
        title="Passive"
        emptyIcon="💡"
        emptyMessage="No passive actions yet"
        titleColor="text-amber-400 dark:text-amber-300"
        entries={sections.passive}
        isExpanded={expanded.passive}
        onToggle={() => toggleSection('passive')}
        onEntryClick={handleEntryClick}
        className="mb-3"
        showFavoritesOnly={favoritesFilter.passive}
        onToggleFavorites={handleToggleFavoritesFilter}
        onToggleFavorite={handleToggleFavorite}
        isFavoritePending={toggleFavoriteMutation.isPending}
      />

      <hr className="border-[var(--border-color)] my-6" />

      {/* ============================================ */}
      {/* 3. Knowledge */}
      {/* ============================================ */}
      <EntrySection
        section="knowledge"
        title="Knowledge"
        emptyIcon="📚"
        emptyMessage="No knowledge entries yet"
        titleColor="text-amber-800 dark:text-amber-500"
        entries={sections.knowledge}
        isExpanded={expanded.knowledge}
        onToggle={() => toggleSection('knowledge')}
        onEntryClick={handleEntryClick}
        className="mb-3"
        showFavoritesOnly={favoritesFilter.knowledge}
        onToggleFavorites={handleToggleFavoritesFilter}
        onToggleFavorite={handleToggleFavorite}
        isFavoritePending={toggleFavoriteMutation.isPending}
      />

      {/* ============================================ */}
      {/* 4. Waiting (only if entries exist) */}
      {/* ============================================ */}
      {sections.waiting.length > 0 && (
        <>
          <hr className="border-[var(--border-color)] my-6" />
          <EntrySection
            section="waiting"
            title="Waiting"
            emptyIcon="⏳"
            emptyMessage="No waiting actions"
            titleColor="text-blue-400 dark:text-blue-300"
            entries={sections.waiting}
            isExpanded={expanded.waiting}
            onToggle={() => toggleSection('waiting')}
            onEntryClick={handleEntryClick}
            className="mb-3"
            showFavoritesOnly={favoritesFilter.waiting}
            onToggleFavorites={handleToggleFavoritesFilter}
            onToggleFavorite={handleToggleFavorite}
            isFavoritePending={toggleFavoriteMutation.isPending}
          />
        </>
      )}

      {/* ============================================ */}
      {/* 5. Paused (only if entries exist) */}
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
            className="opacity-70 mb-3"
            showFavoritesOnly={favoritesFilter.paused}
            onToggleFavorites={handleToggleFavoritesFilter}
            onToggleFavorite={handleToggleFavorite}
            isFavoritePending={toggleFavoriteMutation.isPending}
          />
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-card shadow-card p-6 max-w-sm w-full border border-[var(--border-color)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Delete Topic Block?</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              All related entries will be permanently deleted.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary text-sm px-3 py-1.5">
                Cancel
              </button>
              <button
                onClick={handleDeleteTopic}
                disabled={deleteTopicMutation.isPending}
                className="btn-danger text-sm px-3 py-1.5"
              >
                {deleteTopicMutation.isPending ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}