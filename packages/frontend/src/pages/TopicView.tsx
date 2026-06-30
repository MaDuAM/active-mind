// frontend/src/pages/TopicView.tsx

import { useState, lazy, Suspense, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { usePaginatedEntries, useTopics, useDeleteTopic } from '../hooks';
import { EntryRow } from '../components/EntryRow';
import { Entry } from '../types';

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
  setShowNewEntryForm
 }: TopicViewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [limit] = useState(25);

  // ============================================
  // SECTION EXPAND STATE 
  // ============================================
  const [expanded, setExpanded] = useState({
    active: false,
    passive: false,
    waiting: false,
    paused: false,
    knowledge: false,
  });

  const [allExpanded, setAllExpanded] = useState<'all' | 'none'>('all');

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
    setAllExpanded('none');
  };

  const toggleAll = () => {
    if (allExpanded === 'none') {
      setExpanded({
        active: active.length > 0,
        passive: passive.length > 0,
        waiting: waiting.length > 0,
        paused: paused.length > 0,
        knowledge: knowledge.length > 0,
      });
      setAllExpanded('all');
    } else {
      setExpanded({
        active: false,
        passive: false,
        waiting: false,
        paused: false,
        knowledge: false,
      });
      setAllExpanded('none');
    }
  };

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Haupt-Query: Aktive Einträge
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: entriesLoading,
    refetch: refetchEntries,
  } = usePaginatedEntries({ topicId, limit }, true);

  // ============================================
  // TRASH COUNT: Extra API-Call für Papierkorb-Count
  // ============================================
  const {
    data: trashData,
  } = usePaginatedEntries(
    { topicId, deletedOnly: true, limit: 1 },
    true
  );

  const { data: topics = [], isLoading: topicsLoading } = useTopics(true);
  const deleteTopicMutation = useDeleteTopic();

  const isLoading = entriesLoading || topicsLoading;

  // Flache Liste aller geladenen Entries
  const allEntries = data?.pages.flatMap((page) => page.data) || [];
  const trashCount = trashData?.pages?.[0]?.pagination?.total || 0;

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const topicName = topics.find((t) => t.id === topicId)?.name || 'Unbekannt';
  const activeEntries = allEntries.filter((e: Entry) => !e.deletedAt && e.topicId === topicId);

  // ============================================
  // FILTERS
  // ============================================
  const knowledge = activeEntries.filter((e: Entry) => e.area === 'KNOWLEDGE');
  const active = activeEntries.filter((e: Entry) => e.area === 'ACTIVE' && e.status === 'ACTIVE');
  const passive = activeEntries.filter((e: Entry) => e.area === 'PASSIVE' && e.status === 'ACTIVE');
  const waiting = activeEntries.filter(
    (e: Entry) => e.status === 'WAITING' && e.area !== 'KNOWLEDGE'
  );
  const paused = activeEntries.filter(
    (e: Entry) => e.status === 'PAUSED' && e.area !== 'KNOWLEDGE'
  );

  // ============================================
  // AUTO-OPEN: Sektionen mit Einträgen (initial)
  // ============================================
  useEffect(() => {
    if (!isLoading && allEntries.length > 0) {
      setExpanded({
        active: active.length > 0,
        passive: passive.length > 0,
        waiting: waiting.length > 0,
        paused: paused.length > 0,
        knowledge: knowledge.length > 0,
      });
    }
  }, [data, isLoading, allEntries.length, active.length, passive.length, waiting.length, paused.length, knowledge.length]);

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
  // SKELETON LOADING STATE
  // ============================================
  if (isLoading && allEntries.length === 0) {
    return (
      <div className="max-w-7xl mx-auto animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <div className="h-8 w-48 bg-[var(--bg-secondary)] rounded" />
            <div className="h-4 w-32 bg-[var(--bg-secondary)] rounded" />
          </div>
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
        <div>
          <h1 className="text-2xl font-semibold text-gold-500 tracking-tight">{topicName}</h1>
          {activeEntries.length === 0 && trashCount === 0 && (
            <p className="text-sm text-[var(--text-muted)] mt-1">(empty topic block)</p>
          )}
          {activeEntries.length === 0 && trashCount > 0 && (
            <p className="text-sm text-[var(--text-muted)] mt-1">
              (empty – {trashCount} Entries in Removed Entries)
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeEntries.length === 0 && trashCount === 0 && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteTopicMutation.isPending}
              className="btn-danger text-sm px-3 py-1.5"
            >
              {deleteTopicMutation.isPending ? 'Deleting...' : 'Delete Topic Block'}
            </button>
          )}
          <button onClick={() => setShowNewEntryForm(true)} className="btn-primary text-sm px-3 py-1.5 w-28">
            + New Entry
          </button>
          <button onClick={toggleAll} className="btn-secondary text-sm px-3 py-1.5 w-28">
            {allExpanded === 'all' ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* 1. ACTIVE (immer sichtbar) */}
      {/* ============================================ */}
      <section className="mb-3">
        <div 
          className="flex items-center justify-between mb-3 cursor-pointer"
          onClick={() => toggleSection('active')}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400 dark:text-green-300">
            Active ({active.length})
          </h2>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSection('active');
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors text-xl"
            aria-label={expanded.active ? 'Collapse' : 'Expand'}
          >
            <span className="-translate-y-0.5">
              {expanded.active ? '⏶' : '⏷'}
            </span>
          </button>
        </div>
        {expanded.active && (
          <>
            {active.length === 0 ? (
              <div className="flex items-center gap-3 py-3 text-[var(--text-muted)]">
                <span className="text-xl">⚡</span>
                <div>
                  <p className="text-sm font-medium">No active actions yet</p>
                  <p className="text-xs opacity-60">Create an entry to get started</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {active.map((e: Entry) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    onClick={onOpenEntry}
                    onHover={() => import('../components/EntryDetail')}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <hr className="border-[var(--border-color)] my-6" />

      {/* ============================================ */}
      {/* 2. PASSIVE (immer sichtbar) */}
      {/* ============================================ */}
      <section className="mb-3">
        <div 
          className="flex items-center justify-between mb-3 cursor-pointer"
          onClick={() => toggleSection('passive')}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 dark:text-amber-300">
            Passive ({passive.length})
          </h2>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSection('passive');
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors text-xl"
            aria-label={expanded.passive ? 'Collapse' : 'Expand'}
          >
            <span className="-translate-y-0.5">
              {expanded.passive ? '⏶' : '⏷'}
            </span>
          </button>
        </div>
        {expanded.passive && (
          <>
            {passive.length === 0 ? (
              <div className="flex items-center gap-3 py-3 text-[var(--text-muted)]">
                <span className="text-xl">💡</span>
                <div>
                  <p className="text-sm font-medium">No passive actions yet</p>
                  <p className="text-xs opacity-60">Create an entry to get started</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {passive.map((e: Entry) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    onClick={onOpenEntry}
                    onHover={() => import('../components/EntryDetail')}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <hr className="border-[var(--border-color)] my-6" />

      {/* ============================================ */}
      {/* 3. KNOWLEDGE (immer sichtbar) */}
      {/* ============================================ */}
      <section className="mb-3">
        <div 
          className="flex items-center justify-between mb-3 cursor-pointer"
          onClick={() => toggleSection('knowledge')}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-500">
            Knowledge ({knowledge.length})
          </h2>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSection('knowledge');
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors text-xl"
            aria-label={expanded.knowledge ? 'Collapse' : 'Expand'}
          >
            <span className="-translate-y-0.5">
              {expanded.knowledge ? '⏶' : '⏷'}
            </span>
          </button>
        </div>
        {expanded.knowledge && (
          <>
            {knowledge.length === 0 ? (
              <div className="flex items-center gap-3 py-3 text-[var(--text-muted)]">
                <span className="text-xl">📚</span>
                <div>
                  <p className="text-sm font-medium">No knowledge entries yet</p>
                  <p className="text-xs opacity-60">Create an entry to get started</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {knowledge.map((e: Entry) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    onClick={onOpenEntry}
                    onHover={() => import('../components/EntryDetail')}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* ============================================ */}
      {/* 4. WAITING (nur wenn Einträge) */}
      {/* ============================================ */}
      {waiting.length > 0 && (
        <>
          <hr className="border-[var(--border-color)] my-6" />
          <section className="mb-3">
            <div 
              className="flex items-center justify-between mb-3 cursor-pointer"
              onClick={() => toggleSection('waiting')}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-400 dark:text-blue-300">
                Waiting ({waiting.length})
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection('waiting');
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors text-xl"
                aria-label={expanded.waiting ? 'Collapse' : 'Expand'}
              >
                <span className="-translate-y-0.5">
                  {expanded.waiting ? '⏶' : '⏷'}
                </span>
              </button>
            </div>
            {expanded.waiting && (
              <div className="space-y-2">
                {waiting.map((e: Entry) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    onClick={onOpenEntry}
                    onHover={() => import('../components/EntryDetail')}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ============================================ */}
      {/* 5. PAUSED (nur wenn Einträge) */}
      {/* ============================================ */}
      {paused.length > 0 && (
        <>
          <hr className="border-[var(--border-color)] my-6" />
          <section className="mb-3">
            <div 
              className="flex items-center justify-between mb-3 cursor-pointer"
              onClick={() => toggleSection('paused')}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Paused ({paused.length})
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSection('paused');
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors text-xl"
                aria-label={expanded.paused ? 'Collapse' : 'Expand'}
              >
                <span className="-translate-y-0.5">
                  {expanded.paused ? '⏶' : '⏷'}
                </span>
              </button>
            </div>
            {expanded.paused && (
              <div className="space-y-2">
                {paused.map((e: Entry) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    onClick={onOpenEntry}
                    onHover={() => import('../components/EntryDetail')}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Infinite Scroll Trigger */}
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