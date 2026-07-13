// ============================================
// FILE: frontend/src/components/NewEntryForm.tsx
// PURPOSE: New entry creation form with area-specific fields and validation
// DEPENDENCIES: react, tanstack/react-query, custom hooks, components
// ============================================

import { useState, useRef } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useTopics, useCreateEntry, useCreateTopic } from '../hooks';
import { TopicSelector } from './TopicSelector';
import { EntryFormFields } from './EntryFormFields';
import { StepEditor } from './StepEditor';
import { ConfirmDialog } from './ConfirmDialog';
import { Area, Status, Step, CreateEntryPayload } from '../types';
import { LoadingOverlay } from './LoadingOverlay';
import { useLoadingDebounce } from '../hooks/useLoadingDebounce';

// ============================================
// PROPS
// ============================================
interface NewEntryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// ============================================
// COMPONENT: NewEntryForm
// ============================================
export default function NewEntryForm({ onSuccess, onCancel }: NewEntryFormProps) {
  const { showNotification } = useNotification();

  // ============================================
  // DATA FETCHING & MUTATIONS
  // ============================================
  const { data: topics = [], isLoading: topicsLoading } = useTopics();
  const createEntryMutation = useCreateEntry();
  const createTopicMutation = useCreateTopic();

  // ============================================
  // FORM STATE
  // ============================================
  const initialValues = useRef({
    area: 'KNOWLEDGE' as Area,
    selectedTopicId: null as number | null,
    essenceText: '',
    essenceShort: '',
    actionName: '',
    benefit: '',
    steps: [{ order: 0, description: '' }] as Step[],
    status: 'WAITING' as Status,
    pauseReason: '',
  }).current;

  const [area, setArea] = useState<Area>(initialValues.area);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(initialValues.selectedTopicId);
  const [essenceText, setEssenceText] = useState(initialValues.essenceText);
  const [essenceShort, setEssenceShort] = useState(initialValues.essenceShort);
  const [actionName, setActionName] = useState(initialValues.actionName);
  const [benefit, setBenefit] = useState(initialValues.benefit);
  const [steps, setSteps] = useState<Step[]>(initialValues.steps);
  const [status, setStatus] = useState<Status>(initialValues.status);
  const [pauseReason, setPauseReason] = useState(initialValues.pauseReason);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const isSubmitting = createEntryMutation.isPending || createTopicMutation.isPending;

  // ============================================
  // DIRTY CHECK
  // PURPOSE: Compares current state with initial to detect unsaved changes
  // ============================================
  const isDirty =
    area !== initialValues.area ||
    selectedTopicId !== initialValues.selectedTopicId ||
    essenceText !== initialValues.essenceText ||
    essenceShort !== initialValues.essenceShort ||
    actionName !== initialValues.actionName ||
    benefit !== initialValues.benefit ||
    JSON.stringify(steps) !== JSON.stringify(initialValues.steps) ||
    status !== initialValues.status ||
    pauseReason !== initialValues.pauseReason;

  // ============================================
  // CANCEL HANDLER
  // ============================================
  const handleCancel = () => {
    if (isDirty) {
      setShowConfirmDialog(true);
    } else {
      onCancel();
    }
  };

  const handleConfirmCancel = () => {
    setShowConfirmDialog(false);
    onCancel();
  };

  // ============================================
  // TOPIC CREATION HANDLER
  // ============================================
  const handleCreateTopic = async (name: string) => {
    try {
      const newTopic = await createTopicMutation.mutateAsync(name);
      setSelectedTopicId(newTopic.id);
      showNotification('success', `Topic "${name}" created`);
    } catch (_error) {
      // Error is handled globally
    }
  };

  // ============================================
  // FORM SUBMISSION
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!selectedTopicId) {
      showNotification('error', 'Please select a topic');
      return;
    }

    try {
      const payload: CreateEntryPayload = {
        area,
        topicId: selectedTopicId,
        essenceText,
        essenceShort,
      };

      // Add action-based fields for PASSIVE and ACTIVE
      if (area !== 'KNOWLEDGE') {
        payload.actionName = actionName;
        if (benefit) payload.benefit = benefit;
        payload.status = status;
        if (status === 'WAITING') {
          payload.pauseReason = pauseReason;
        }
      }

      // Add steps only for ACTIVE entries
      if (area === 'ACTIVE') {
        payload.steps = steps.map((s) => ({ description: s.description }));
      }

      await createEntryMutation.mutateAsync(payload);
      showNotification('success', 'Entry successfully created');
      onSuccess();
    } catch (_error) {
      // Error is handled globally
    }
  };

  // ============================================
  // VALIDATION
  // ============================================
  const isValid = () => {
    if (!essenceText || !essenceShort) return false;
    if (!selectedTopicId) return false;
    if (area !== 'KNOWLEDGE') {
      if (!actionName) return false;
      if (status === 'WAITING' && !pauseReason) return false;
    }
    if (area === 'ACTIVE') {
      if (steps.some((s) => !s.description)) return false;
    }
    return true;
  };

  // ============================================
  // LOADING STATE
  // ============================================
  const showLoading = useLoadingDebounce(topicsLoading, 200);

  if (showLoading) {
    return (
      <div 
        className="fixed inset-0 z-[1000] bg-black/20 backdrop-blur-sm"
        onClick={handleCancel}
      >
        <div 
          className="fixed inset-y-0 right-0 w-full sm:w-[80vw] sm:min-w-[350px] sm:max-w-[800px] bg-[var(--bg-card)] shadow-dropdown border-l border-[var(--border-color)] p-6 overflow-y-auto flex flex-col items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <LoadingOverlay message="Loading topics..." />
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div 
      className="fixed inset-0 z-[1000] bg-black/20 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <div 
        className="fixed inset-y-0 right-0 w-full sm:w-[80vw] sm:min-w-[350px] sm:max-w-[800px] bg-[var(--bg-card)] shadow-dropdown border-l border-[var(--border-color)] p-6 overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gold-500 text-left w-full">
            New Entry
          </h2>
          <div className="hidden sm:block w-8" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 pb-20 sm:pb-0">
          {/* Topic Selector */}
          <TopicSelector
            topics={topics}
            selectedTopicId={selectedTopicId}
            onSelectTopic={setSelectedTopicId}
            onCreateNew={handleCreateTopic}
            isCreating={createTopicMutation.isPending}
            disabled={isSubmitting}
          />

          {/* Area Selection */}
          <div>
            <label className="label">Area</label>
            <div className="flex gap-4 text-sm text-[var(--text-primary)]">
              {(['KNOWLEDGE', 'PASSIVE', 'ACTIVE'] as Area[]).map((a) => (
                <label key={a} className="flex items-center gap-1">
                  <input
                    type="radio"
                    value={a}
                    checked={area === a}
                    onChange={() => setArea(a)}
                    disabled={isSubmitting}
                  />
                  {a}
                </label>
              ))}
            </div>
          </div>

          {/* Entry Form Fields */}
          <EntryFormFields
            area={area}
            essenceText={essenceText}
            essenceShort={essenceShort}
            actionName={actionName}
            benefit={benefit}
            status={status}
            pauseReason={pauseReason}
            onEssenceTextChange={setEssenceText}
            onEssenceShortChange={setEssenceShort}
            onActionNameChange={setActionName}
            onBenefitChange={setBenefit}
            onStatusChange={setStatus}
            onPauseReasonChange={setPauseReason}
            disabled={isSubmitting}
          />

          {/* Steps Editor (only for ACTIVE) */}
          {area === 'ACTIVE' && (
            <StepEditor
              steps={steps}
              onChange={setSteps}
              disabled={isSubmitting}
            />
          )}

          {/* Desktop: Submit/Cancel Buttons */}
          <div className="hidden sm:flex gap-3 pt-4 border-t border-[var(--border-color)]">
            <button
              type="submit"
              disabled={!isValid() || isSubmitting}
              className="btn-primary text-sm px-3 py-1.5 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Entry'}
            </button>
            <button 
              type="button" 
              onClick={handleCancel} 
              className="btn-secondary text-sm px-3 py-1.5"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Mobile: Action Buttons */}
        <div className="sm:hidden shrink-0 pt-4 mt-4 border-t border-[var(--border-color)]">
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!isValid() || isSubmitting}
              className="btn-primary text-sm px-3 py-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Creating...' : 'Create Entry'}
            </button>
            <button 
              type="button" 
              onClick={handleCancel} 
              className="btn-secondary text-sm px-3 py-2 flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={showConfirmDialog}
          title="Discard entries?"
          message="Are you sure you want to discard the entries? The entry will not be created."
          onConfirm={handleConfirmCancel}
          onCancel={() => setShowConfirmDialog(false)}
        />
      </div>
    </div>
  );
}