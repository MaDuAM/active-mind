// frontend/src/pages/Dashboard.tsx

import { useState, lazy, Suspense, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { usePaginatedEntries, useTopics } from '../hooks';
import { EntryRow } from '../components/EntryRow';
import { Entry, Topic } from '../types';

const NewEntryForm = lazy(() => import('../components/NewEntryForm'));

interface DashboardProps {
  onOpenEntry: (id: number) => void;
  showNewEntryForm: boolean;
  setShowNewEntryForm: (value: boolean) => void;
}

export function Dashboard({ onOpenEntry, showNewEntryForm, setShowNewEntryForm }: DashboardProps) {
  const [limit] = useState(25);

  // ============================================
  // SECTION EXPAND STATE 
  // ============================================
  const [expanded, setExpanded] = useState({
    active: false,
    passive: false,
    waiting: false,
    paused: false,
  });

  const [allExpanded, setAllExpanded] = useState<'all' | 'none'>('all');

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
    setAllExpanded('none');
  };

  const toggleAll = () => {
    if (allExpanded === 'none') {
      setExpanded({
        active: activeActive.length > 0,
        passive: activePassive.length > 0,
        waiting: waitingEntries.length > 0,
        paused: (pausedActive.length + pausedPassive.length) > 0,
      });
      setAllExpanded('all');
    } else {
      setExpanded({
        active: false,
        passive: false,
        waiting: false,
        paused: false,
      });
      setAllExpanded('none');
    }
  };

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

  const {
    allEntries,
    totalEntries,
    knowledgeCount,
    activeCount,
    passiveCount,
    waitingEntries,
    activeActive,
    activePassive,
    pausedActive,
    pausedPassive,
  } = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.data) || [];
    
    const knowledge = all.filter((e: Entry) => e.area === 'KNOWLEDGE').length;
    const active = all.filter((e: Entry) => e.area === 'ACTIVE').length;
    const passive = all.filter((e: Entry) => e.area === 'PASSIVE').length;
    
    const waiting = all.filter(
      (e: Entry) => e.status === 'WAITING' && e.area !== 'KNOWLEDGE'
    );
    const activeAct = all.filter(
      (e: Entry) => e.area === 'ACTIVE' && e.status === 'ACTIVE'
    );
    const activePass = all.filter(
      (e: Entry) => e.area === 'PASSIVE' && e.status === 'ACTIVE'
    );
    const pausedAct = all.filter(
      (e: Entry) => e.area === 'ACTIVE' && e.status === 'PAUSED'
    );
    const pausedPass = all.filter(
      (e: Entry) => e.area === 'PASSIVE' && e.status === 'PAUSED'
    );

    return {
      allEntries: all,
      totalEntries: all.length,
      knowledgeCount: knowledge,
      activeCount: active,
      passiveCount: passive,
      waitingEntries: waiting,
      activeActive: activeAct,
      activePassive: activePass,
      pausedActive: pausedAct,
      pausedPassive: pausedPass,
    };
  }, [data]);

  // ============================================
  // AUTO-OPEN: Sektionen mit Einträgen (initial)
  // ============================================
  useEffect(() => {
    if (!isLoading && allEntries.length > 0) {
      setExpanded({
        active: activeActive.length > 0,
        passive: activePassive.length > 0,
        waiting: waitingEntries.length > 0,
        paused: (pausedActive.length + pausedPassive.length) > 0,
      });
    }
  }, [data, isLoading, allEntries.length, activeActive.length, activePassive.length, waitingEntries.length, pausedActive.length, pausedPassive.length]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getTopicName = (topicId: number) => topics.find((t: Topic) => t.id === topicId)?.name || '?';

  // ============================================
  // SKELETON LOADING STATE
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
      {/* ACTIVE ACTIONS (immer sichtbar) */}
      {/* ============================================ */}
      <section className="mb-3">
        <div 
          className="flex items-center justify-between mb-3 cursor-pointer"
          onClick={() => toggleSection('active')}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-green-400 dark:text-green-300">
            Active Actions ({activeActive.length})
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
            {activeActive.length === 0 ? (
              <div className="flex items-center gap-3 py-3 text-[var(--text-muted)]">
                <span className="text-xl">⚡</span>
                <div>
                  <p className="text-sm font-medium">No active actions yet</p>
                  <p className="text-xs opacity-60">Create an entry to get started</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {activeActive.map((e: Entry) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    onClick={onOpenEntry}
                    onHover={() => import('../components/EntryDetail')}
                    showTopic
                    topicName={getTopicName(e.topicId)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <hr className="border-[var(--border-color)] my-6" />

      {/* ============================================ */}
      {/* PASSIVE ACTIONS (immer sichtbar) */}
      {/* ============================================ */}
      <section className="mb-3">
        <div 
          className="flex items-center justify-between mb-3 cursor-pointer"
          onClick={() => toggleSection('passive')}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400 dark:text-amber-300">
            Passive Actions ({activePassive.length})
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
            {activePassive.length === 0 ? (
              <div className="flex items-center gap-3 py-3 text-[var(--text-muted)]">
                <span className="text-xl">💡</span>
                <div>
                  <p className="text-sm font-medium">No passive actions yet</p>
                  <p className="text-xs opacity-60">Create an entry to get started</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {activePassive.map((e: Entry) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    onClick={onOpenEntry}
                    onHover={() => import('../components/EntryDetail')}
                    showTopic
                    topicName={getTopicName(e.topicId)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* ============================================ */}
      {/* WAITING ACTIONS (nur wenn Einträge) */}
      {/* ============================================ */}
      {waitingEntries.length > 0 && (
        <>
          <hr className="border-[var(--border-color)] my-6" />
          <section className="mb-3">
            <div 
              className="flex items-center justify-between mb-3 cursor-pointer"
              onClick={() => toggleSection('waiting')}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-400 dark:text-blue-300">
                Waiting Actions ({waitingEntries.length})
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
                {waitingEntries.map((e: Entry) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    onClick={onOpenEntry}
                    onHover={() => import('../components/EntryDetail')}
                    showTopic
                    topicName={getTopicName(e.topicId)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ============================================ */}
      {/* PAUSED (nur wenn Einträge) */}
      {/* ============================================ */}
      {(pausedActive.length + pausedPassive.length) > 0 && (
        <>
          <hr className="border-[var(--border-color)] my-6" />
          <section className="opacity-70">
            <div 
              className="flex items-center justify-between mb-3 cursor-pointer"
              onClick={() => toggleSection('paused')}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Paused ({pausedActive.length + pausedPassive.length})
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
                {pausedActive.map((e: Entry) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    onClick={onOpenEntry}
                    onHover={() => import('../components/EntryDetail')}
                    showTopic
                    topicName={getTopicName(e.topicId)}
                  />
                ))}
                {pausedPassive.map((e: Entry) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    onClick={onOpenEntry}
                    onHover={() => import('../components/EntryDetail')}
                    showTopic
                    topicName={getTopicName(e.topicId)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Infinite Scroll Trigger / Loading Indicator */}
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

      {/* Alle geladen - Info mit Statistik */}
      {!hasNextPage && totalEntries > 0 && (
        <div className="py-4 text-center text-sm text-[var(--text-muted)] space-y-1">
          <div>{totalEntries} entries loaded</div>
          <div className="flex justify-center gap-4 text-xs">
            <span>⚡ Active: {activeCount}</span>
            <span>💡 Passive: {passiveCount}</span>
            <span>📚 Knowledge: {knowledgeCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}