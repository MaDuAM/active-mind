// frontend/src/pages/Dashboard.tsx

import { useState, lazy, Suspense, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { usePaginatedEntries, useTopics } from '../hooks';
import { useSectionState } from '../hooks/useSectionState';
import { EntrySection } from '../components/EntrySection';
import { Entry } from '../types';

const NewEntryForm = lazy(() => import('../components/NewEntryForm'));

interface DashboardProps {
  onOpenEntry: (id: number) => void;
  showNewEntryForm: boolean;
  setShowNewEntryForm: (value: boolean) => void;
}

export function Dashboard({ onOpenEntry, showNewEntryForm, setShowNewEntryForm }: DashboardProps) {
  const [limit] = useState(25);

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: entriesLoading,
    refetch: refetchEntries,
  } = usePaginatedEntries({ limit }, true);

  const { data: topics = [], isLoading: topicsLoading } = useTopics(true);

  const isLoading = entriesLoading || topicsLoading;

  // ============================================
  // Computed Data: Group entries by section
  // ============================================
  const allEntries = data?.pages.flatMap((page) => page.data) || [];

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
  // Section State
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
  // Infinite Scroll
  // ============================================
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getTopicName = (topicId: number) =>
    topics.find((t) => t.id === topicId)?.name || '?';

  // ============================================
  // Skeleton Loading State
  // ============================================
  if (isLoading && allEntries.length === 0) {
    return (
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-[var(--bg-secondary)] rounded" />
          <div className="h-9 w-28 bg-[var(--bg-secondary)] rounded" />
        </div>
        <div className="mb-8">
          <div className="h-4 w-32 bg-[var(--bg-secondary)] rounded mb-3" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-[var(--bg-secondary)] rounded" />
            ))}
          </div>
        </div>
        <hr className="border-[var(--border-color)] my-6" />
        <div className="mb-8">
          <div className="h-4 w-32 bg-[var(--bg-secondary)] rounded mb-3" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-[var(--bg-secondary)] rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* New Entry Form Overlay */}
      {showNewEntryForm && (
        <Suspense fallback={<div className="p-6 text-[var(--text-secondary)]">Loading Form...</div>}>
          <NewEntryForm
            onSuccess={() => {
              setShowNewEntryForm(false);
              refetchEntries();
            }}
            onCancel={() => setShowNewEntryForm(false)}
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
        onEntryClick={onOpenEntry}
        showTopic
        getTopicName={getTopicName}
        className="mb-3"
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
        onEntryClick={onOpenEntry}
        showTopic
        getTopicName={getTopicName}
        className="mb-3"
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
            onEntryClick={onOpenEntry}
            showTopic
            getTopicName={getTopicName}
            className="mb-3"
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
            onEntryClick={onOpenEntry}
            showTopic
            getTopicName={getTopicName}
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