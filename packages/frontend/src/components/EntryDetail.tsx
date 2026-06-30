// frontend/src/components/EntryDetail.tsx

import { useState } from 'react';
import { useEntry, useStatusChange, useStepChange, useUpdateEntry, useDeleteEntry, useManualTracking } from '../hooks';
import { useNotification } from '../context/NotificationContext';
import { EntryView } from './EntryView';
import { EntryEdit } from './EntryEdit';
import { TrackingPopup } from './TrackingPopup';
import { ManualTrackPopup } from './ManualTrackPopup';
import { ConfirmDialog } from './ConfirmDialog';
import { Status, Step } from '../types';

interface EntryDetailProps {
  entryId: number;
  onClose: () => void;
}

type PendingAction =
  | { type: 'status'; data: { newStatus: Status } }
  | { type: 'step'; data: { newStepIndex: number } }
  | { type: 'edit'; data: {
      essenceText: string;
      essenceShort: string;
      actionName: string;
      benefit: string;
      steps: Step[];
      changeNote: string;
    } };

export default function EntryDetail({ entryId, onClose }: EntryDetailProps) {
  const { showNotification } = useNotification();
  const { data: entry, isLoading, refetch } = useEntry(entryId);

  const statusMutation = useStatusChange();
  const stepMutation = useStepChange();
  const updateMutation = useUpdateEntry();
  const deleteMutation = useDeleteEntry();
  const manualTrackingMutation = useManualTracking();

  const [isEditing, setIsEditing] = useState(false);
  const [showTrackingPopup, setShowTrackingPopup] = useState(false);
  const [showManualTrack, setShowManualTrack] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState<'close' | 'edit-cancel' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasActualChanges, setHasActualChanges] = useState(false);

  const isDirty = isEditing && hasActualChanges;

  const handleEditChange = (hasChanges: boolean) => {
    setHasActualChanges(hasChanges);
  };

  const handleClose = () => {
    if (isEditing) {
      if (isDirty) {
        setPendingCloseAction('edit-cancel');
        setShowConfirmDialog(true);
      } else {
        setIsEditing(false);
        setHasActualChanges(false);
      }
    } else {
      onClose();
    }
  };

  const handleEditCancel = () => {
    if (isDirty) {
      setPendingCloseAction('edit-cancel');
      setShowConfirmDialog(true);
    } else {
      setIsEditing(false);
      setHasActualChanges(false);
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    if (pendingCloseAction === 'close') {
      onClose();
    } else if (pendingCloseAction === 'edit-cancel') {
      setIsEditing(false);
      setHasActualChanges(false);
    }
    setPendingCloseAction(null);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await deleteMutation.mutateAsync(entry!.id);
      showNotification('success', 'Entry moved to Removed Entries');
      onClose();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const handleStatusChange = (newStatus: Status) => {
    setPendingAction({ type: 'status', data: { newStatus } });
    setShowTrackingPopup(true);
  };

  const handleStepChange = (newStepIndex: number) => {
    setPendingAction({ type: 'step', data: { newStepIndex } });
    setShowTrackingPopup(true);
  };

  const handleEditSave = async (data: {
    essenceText: string;
    essenceShort: string;
    actionName: string;
    benefit: string;
    steps: Step[];
    changeNote: string;
  }) => {
    try {
      await updateMutation.mutateAsync({
        id: entryData.id,
        ...data,
      });
      setIsEditing(false);
      setHasActualChanges(false);
      showNotification('success', 'Entry updated');
      refetch();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Update failed');
    }
  };

  const handleTrackingConfirm = async (note: string) => {
    try {
      if (!pendingAction) {
        return;
      }

      if (pendingAction.type === 'status') {
        await statusMutation.mutateAsync({
          id: entryData.id,
          newStatus: pendingAction.data.newStatus,
          note: note || undefined,
        });
        showNotification('success', `Status changed to ${pendingAction.data.newStatus}`);
      } else if (pendingAction.type === 'step') {
        await stepMutation.mutateAsync({
          id: entryData.id,
          newStepIndex: pendingAction.data.newStepIndex,
          note: note || undefined,
        });
        showNotification('success', 'Step updated');
      } else if (pendingAction.type === 'edit') {
        await updateMutation.mutateAsync({
          id: entryData.id,
          ...pendingAction.data,
        });
        setIsEditing(false);
        setHasActualChanges(false);
        showNotification('success', 'Entry updated');
        setShowTrackingPopup(false);
        setPendingAction(null);
        refetch();
        return;
      }

      setShowTrackingPopup(false);
      setPendingAction(null);
      refetch();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Change failed');
    }
  };

  const handleManualTrack = async (timestamp: string, note: string) => {
    try {
      await manualTrackingMutation.mutateAsync({
        id: entryData.id,
        timestamp,
        note,
      });
      showNotification('success', 'Manual tracking added');
      setShowManualTrack(false);
      refetch();
    } catch (_error) {
      // Fehler wird global behandelt
    }
  };

  const isPending =
    statusMutation.isPending ||
    stepMutation.isPending ||
    updateMutation.isPending ||
    manualTrackingMutation.isPending;

  const getConfirmDialogTitle = () => {
    if (pendingCloseAction === 'edit-cancel') {
      return 'Leave edit mode?';
    }
    return 'Close entry?';
  };

  const getConfirmDialogMessage = () => {
    if (pendingCloseAction === 'edit-cancel') {
      return 'Do you really want to leave edit mode? Your changes will be lost.';
    }
    return 'Do you really want to close this entry?';
  };

  // ============================================
  // SKELETON LOADING STATE (strukturgetreu)
  // ============================================
  if (isLoading) {
    return (
      <div 
        className="fixed inset-0 z-[1000] bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <div 
          className="fixed inset-y-0 right-0 w-[85vw] min-w-[400px] max-w-[900px] bg-[var(--bg-card)] shadow-dropdown border-l border-[var(--border-color)] p-6 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)]" />
              <div className="h-7 w-40 bg-[var(--bg-secondary)] rounded" />
            </div>
            <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)]" />
          </div>

          <div className="space-y-4 animate-pulse">
            {/* Status Skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-12 bg-[var(--bg-secondary)] rounded" />
              <div className="h-6 w-20 bg-[var(--bg-secondary)] rounded-full" />
            </div>

            {/* Essence Long Kachel Skeleton */}
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 bg-[var(--bg-secondary)] rounded" />
                <div className="h-4 w-12 bg-[var(--bg-secondary)] rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-[var(--bg-secondary)] rounded" />
                <div className="h-4 w-3/4 bg-[var(--bg-secondary)] rounded" />
                <div className="h-4 w-1/2 bg-[var(--bg-secondary)] rounded" />
              </div>
            </div>

            {/* Essence Short Kachel Skeleton */}
            <div className="card space-y-1">
              <div className="h-3 w-12 bg-[var(--bg-secondary)] rounded" />
              <div className="h-4 w-1/2 bg-[var(--bg-secondary)] rounded" />
            </div>

            {/* Steps Kachel Skeleton */}
            <div className="card space-y-2">
              <div className="h-3 w-12 bg-[var(--bg-secondary)] rounded" />
              <div className="space-y-1">
                <div className="h-4 w-full bg-[var(--bg-secondary)] rounded" />
                <div className="h-4 w-3/4 bg-[var(--bg-secondary)] rounded" />
                <div className="h-4 w-1/2 bg-[var(--bg-secondary)] rounded" />
              </div>
              <div className="flex gap-2 mt-2">
                <div className="h-8 w-20 bg-[var(--bg-secondary)] rounded" />
                <div className="h-8 w-20 bg-[var(--bg-secondary)] rounded" />
              </div>
            </div>

            {/* Actions Skeleton */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--border-color)]">
              <div className="h-9 w-16 bg-[var(--bg-secondary)] rounded" />
              <div className="h-9 w-28 bg-[var(--bg-secondary)] rounded" />
              <div className="h-9 w-28 bg-[var(--bg-secondary)] rounded" />
              <div className="h-9 w-16 bg-[var(--bg-secondary)] rounded" />
            </div>

            {/* Tracking Log Skeleton */}
            <div className="pt-4 border-t border-[var(--border-color)]">
              <div className="h-4 w-24 bg-[var(--bg-secondary)] rounded mb-3" />
              <div className="card p-3 space-y-1.5">
                <div className="h-3 w-16 bg-[var(--bg-secondary)] rounded" />
                <div className="h-3 w-full bg-[var(--bg-secondary)] rounded" />
                <div className="h-3 w-3/4 bg-[var(--bg-secondary)] rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div 
        className="fixed inset-0 z-[1000] bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      >
        <div 
          className="fixed inset-y-0 right-0 w-[85vw] min-w-[400px] max-w-[900px] bg-[var(--bg-card)] shadow-dropdown border-l border-[var(--border-color)] p-6 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Entry Details</h2>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
              ✕
            </button>
          </div>
          <div className="p-6 text-[var(--text-secondary)] text-center">Entry not found</div>
        </div>
      </div>
    );
  }

  const entryData = entry;

  return (
    <div 
      className="fixed inset-0 z-[1000] bg-black/20 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        className="fixed inset-y-0 right-0 w-[85vw] min-w-[400px] max-w-[900px] bg-[var(--bg-card)] shadow-dropdown border-l border-[var(--border-color)] p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================ */}
        {/* HEADER: Zurück-Button + Action Name + Edit-Badge */}
        {/* ============================================ */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors disabled:opacity-50 text-xl font-serif leading-none"
              disabled={isPending}
              aria-label="Go back"
            >
              <span className="-translate-y-0.5">‹</span>
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gold-500">
                {entryData.actionName || entryData.essenceShort || 'Entry'}
              </h2>
              {isEditing && (
                <span className="text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
                  Edit
                </span>
              )}
            </div>
          </div>
        </div>

        {!isEditing ? (
          <EntryView
            entry={entryData}
            onEdit={() => setIsEditing(true)}
            onStatusChange={handleStatusChange}
            onStepChange={handleStepChange}
            onDelete={handleDelete}
            onManualTrack={() => setShowManualTrack(true)}
            isStatusPending={statusMutation.isPending}
            isStepPending={stepMutation.isPending}
          />
        ) : (
          <EntryEdit
            entry={entryData}
            onSave={handleEditSave}
            onCancel={handleEditCancel}
            isPending={updateMutation.isPending}
            onChange={handleEditChange}
          />
        )}

        {/* Popups */}
        <TrackingPopup
          isOpen={showTrackingPopup}
          onConfirm={handleTrackingConfirm}
          onCancel={() => {
            setShowTrackingPopup(false);
            setPendingAction(null);
          }}
          isPending={
            statusMutation.isPending ||
            stepMutation.isPending ||
            updateMutation.isPending
          }
        />

        <ManualTrackPopup
          isOpen={showManualTrack}
          onConfirm={handleManualTrack}
          onCancel={() => setShowManualTrack(false)}
          isPending={manualTrackingMutation.isPending}
        />

        {/* Delete Confirm Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Delete entry?"
          message="Do you want to move this entry to Removed Entries?"
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        {/* Dirty-Check Confirm Dialog */}
        <ConfirmDialog
          isOpen={showConfirmDialog}
          title={getConfirmDialogTitle()}
          message={getConfirmDialogMessage()}
          confirmLabel="Leave"
          onConfirm={handleConfirmClose}
          onCancel={() => {
            setShowConfirmDialog(false);
            setPendingCloseAction(null);
          }}
        />
      </div>
    </div>
  );
}