// frontend/src/pages/Trash.tsx

import { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { usePaginatedEntries, useTopics, useRestoreEntry, usePermanentDeleteEntry } from '../hooks';
import { useNotification } from '../context/NotificationContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Entry } from '../types';
import { apiClient } from '../lib/apiClient';

export function Trash() {
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const [limit] = useState(25);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
  } = usePaginatedEntries(
    { deletedOnly: true, limit, sortBy: 'deletedAt', sortOrder: 'desc' },
    true
  );

  const { data: topics = [], isLoading: topicsLoading } = useTopics(true);

  const restoreMutation = useRestoreEntry();
  const permanentDeleteMutation = usePermanentDeleteEntry();

  const isLoading = entriesLoading || topicsLoading;
  const allEntries = data?.pages.flatMap((page) => page.data) || [];

  // ============================================
  // Clear All Mutation
  // ============================================
  const clearTrashMutation = useMutation({
    mutationFn: async () => {
      const ids = allEntries.map((e) => e.id);
      if (ids.length === 0) return;
      await Promise.all(ids.map((id) =>
        apiClient.delete(`/entries/${id}/permanent`)
      ));
    },
    onSuccess: () => {
      showNotification('success', 'Removed Entries cleared');
      refetchEntries();
      queryClient.refetchQueries({ queryKey: ['entries-paginated'] });
    },
    onError: (error) => {
      showNotification('error', error instanceof Error ? error.message : 'Failed to clear trash');
    },
  });

  // ============================================
  // Infinite Scroll
  // ============================================
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================
  // Memoized Callbacks
  // ============================================
  const getTopicName = useCallback(
    (topicId: number) => topics.find((t) => t.id === topicId)?.name || '?',
    [topics]
  );

  // ============================================
  // Handlers
  // ============================================
  const handleRestore = async (id: number) => {
    try {
      await restoreMutation.mutateAsync(id);
      showNotification('success', 'Entry restored');
      refetchEntries();
      queryClient.refetchQueries({
        queryKey: ['entries-paginated']
      });
    } catch (_error) {
      // Error is handled globally
    }
  };

  const handlePermanentDelete = (id: number) => {
    setPendingDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await permanentDeleteMutation.mutateAsync(pendingDeleteId);
      showNotification('success', 'Entry permanently deleted');
      refetchEntries();
      queryClient.refetchQueries({
        queryKey: ['entries-paginated']
      });
    } catch (_error) {
      // Error is handled globally
    } finally {
      setShowDeleteConfirm(false);
      setPendingDeleteId(null);
    }
  };

  // ============================================
  // Skeleton Loading State
  // ============================================
  if (isLoading && allEntries.length === 0) {
    return <div className="p-6 text-[var(--text-secondary)]">Loading Removed Entries...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Clear All button */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
        <h1 className="text-2xl font-semibold text-gold-500 tracking-tight">Removed Entries</h1>
        <button
          onClick={() => setShowClearConfirm(true)}
          disabled={allEntries.length === 0 || clearTrashMutation.isPending}
          className="border border-error text-error hover:bg-error hover:text-white transition-colors text-sm px-3 py-1.5 rounded-button font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {clearTrashMutation.isPending ? 'Clearing...' : 'Clear all'}
        </button>
      </div>

      {/* Empty State or Entry List */}
      {allEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-[var(--text-muted)]">
          <span className="text-2xl mb-4">🗑️</span>
          <p className="text-md font-medium">Removed Entries is empty</p>
          <p className="text-xs opacity-60">Deleted entries will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allEntries.map((entry: Entry) => (
            <div
              key={entry.id}
              className="card flex items-center justify-between gap-4 hover:border-[var(--border-color)] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-[var(--text-primary)] truncate">
                    {entry.actionName || entry.essenceShort}
                  </strong>
                  <span className="text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                    {getTopicName(entry.topicId)}
                  </span>
                  {entry.benefit && (
                    <span className="text-xs text-gold-500 bg-gold-50/50 px-2 py-0.5 rounded-full">
                      ✨ {entry.benefit}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1">
                  Deleted:{' '}
                  {entry.deletedAt
                    ? new Date(entry.deletedAt).toLocaleDateString()
                    : 'Unknown'}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRestore(entry.id)}
                  disabled={restoreMutation.isPending}
                  className="border border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-colors text-sm px-3 py-1.5 rounded-button font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {restoreMutation.isPending ? 'Restoring...' : 'Restore'}
                </button>
                <button
                  onClick={() => handlePermanentDelete(entry.id)}
                  disabled={permanentDeleteMutation.isPending}
                  className="btn-danger text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {permanentDeleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          ))}

          {/* Infinite Scroll Trigger */}
          {hasNextPage && (
            <div ref={ref} className="py-6 text-center">
              {isFetchingNextPage ? (
                <div className="text-sm text-[var(--text-muted)]">Loading more entries...</div>
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
        </div>
      )}

      {/* Confirm Dialog for single permanent delete */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete entry permanently?"
        message="This entry will be permanently deleted and cannot be recovered."
        confirmLabel="Delete permanently"
        onConfirm={handleConfirmPermanentDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setPendingDeleteId(null);
        }}
        isPending={permanentDeleteMutation.isPending}
      />

      {/* Confirm Dialog for Clear All */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear Removed Entries?"
        message="All entries in Removed Entries will be permanently deleted. This cannot be undone."
        confirmLabel="Clear all"
        onConfirm={() => {
          setShowClearConfirm(false);
          clearTrashMutation.mutate();
        }}
        onCancel={() => setShowClearConfirm(false)}
        isPending={clearTrashMutation.isPending}
      />
    </div>
  );
}