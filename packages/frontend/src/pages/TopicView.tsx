// frontend/src/pages/TopicView.tsx

import { useState, lazy, Suspense, useEffect, useMemo, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { usePaginatedEntries, useTopics, useDeleteTopic } from '../hooks';
import { useSectionState } from '../hooks/useSectionState';
import { EntrySection } from '../components/EntrySection';
import { Entry } from '../types';
import { LoadingOverlay } from '../components/LoadingOverlay';

const NewEntryForm = lazy(() => import('../components/NewEntryForm'));

interface TopicViewProps {
  topicId: number;
  onOpenEntry: (id: number) => void;
  onTopicDeleted: () => void;
  showNewEntryForm: boolean;
  setShowNewEntryForm: (value: boolean) => void;
}

export default function TopicView({
  topicId,
  onOpenEntry,
  onTopicDeleted,
  showNewEntryForm,
  setShowNewEntryForm,
}: TopicViewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [limit] = useState(25);

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
  } = usePaginatedEntries({ topicId, limit }, true);

  const {
    data: trashData,
  } = usePaginatedEntries(
    { topicId, deletedOnly: true, limit: 1 },
    true
  );

  const { data: topics = [], isLoading: topicsLoading } = useTopics(true);
  const deleteTopicMutation = useDeleteTopic();

  const isLoading = entriesLoading || topicsLoading;
  const allEntries = data?.pages.flatMap((page) => page.data) || [];
  const trashCount = trashData?.pages?.[0]?.pagination?.total || 0;

  // ============================================
  // Computed Data: Group entries by section
  // ============================================
  const sections = useMemo(() => {
    const activeEntries = allEntries.filter((e: Entry) => !e.deletedAt && e.topicId === topicId);

    const active = activeEntries.filter(
      (e: Entry) => e.area === 'ACTIVE' && e.status === 'ACTIVE'
    );
    const passive = activeEntries.filter(
      (e: Entry) => e.area === 'PASSIVE' && e.status === 'ACTIVE'
    );
    const waiting = activeEntries.filter(
      (e: Entry) => e.status === 'WAITING' && e.area !== 'KNOWLEDGE'
    );
    const paused = activeEntries.filter(
      (e: Entry) => e.status === 'PAUSED' && e.area !== 'KNOWLEDGE'
    );
    const knowledge = activeEntries.filter(
      (e: Entry) => e.area === 'KNOWLEDGE'
    );

    return {
      active,
      passive,
      waiting,
      paused,
      knowledge,
      total: activeEntries.length,
    };
  }, [allEntries, topicId]);

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
    deps: [allEntries.length],
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
    refetchEntries();
  }, [setShowNewEntryForm, refetchEntries]);

  const handleNewEntryCancel = useCallback(() => {
    setShowNewEntryForm(false);
  }, [setShowNewEntryForm]);

  // ============================================
  // Infinite Scroll
  // ============================================
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================
  // Handlers
  // ============================================
  const topicName = topics.find((t) => t.id === topicId)?.name || 'Unbekannt';

  const handleDeleteTopic = async () => {
    try {
      await deleteTopicMutation.mutateAsync(topicId);
      await refetchEntries();
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
  if (isLoading && allEntries.length === 0) {
    return <LoadingOverlay message="Loading entries..." fullScreen={false} />;
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
          <button onClick={toggleAll} className="btn-secondary text-sm px-3 py-1.5 w-28">
            {allExpanded === 'all' ? 'Collapse all' : 'Expand all'}
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

      {!hasNextPage && allEntries.length > 0 && (
        <div className="py-4 text-center text-sm text-[var(--text-muted)]">
          {allEntries.length} entries loaded
        </div>
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