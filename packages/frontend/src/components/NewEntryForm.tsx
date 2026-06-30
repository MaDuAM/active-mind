// frontend/src/components/NewEntryForm.tsx

import { useState, useRef } from 'react';
import { useNotification } from '../context/NotificationContext';
import { useTopics, useCreateEntry, useCreateTopic } from '../hooks';
import { TopicSelector } from './TopicSelector';
import { EntryFormFields } from './EntryFormFields';
import { StepEditor } from './StepEditor';
import { ConfirmDialog } from './ConfirmDialog';
import { Area, Status, Step, CreateEntryPayload } from '../types';

interface NewEntryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function NewEntryForm({ onSuccess, onCancel }: NewEntryFormProps) {
  const { showNotification } = useNotification();

  const { data: topics = [], isLoading: topicsLoading } = useTopics();
  const createEntryMutation = useCreateEntry();
  const createTopicMutation = useCreateTopic();

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

  const handleCreateTopic = async (name: string) => {
    try {
      const newTopic = await createTopicMutation.mutateAsync(name);
      setSelectedTopicId(newTopic.id);
      showNotification('success', `Topic "${name}" created`);
    } catch (_error) {
      // Fehler wird global behandelt
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!selectedTopicId) {
      showNotification('error', 'Bitte wähle ein Topic aus');
      return;
    }

    try {
      const payload: CreateEntryPayload = {
        area,
        topicId: selectedTopicId,
        essenceText,
        essenceShort,
      };

      if (area !== 'KNOWLEDGE') {
        payload.actionName = actionName;
        if (benefit) payload.benefit = benefit;
        payload.status = status;
        if (status === 'WAITING') {
          payload.pauseReason = pauseReason;
        }
      }

      if (area === 'ACTIVE') {
        payload.steps = steps.map((s) => ({ description: s.description }));
      }

      await createEntryMutation.mutateAsync(payload);
      showNotification('success', 'Entry successfully created');
      onSuccess();
    } catch (_error) {
      // Fehler wird global behandelt
    }
  };

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

  if (topicsLoading) {
    return (
      <div 
        className="fixed inset-0 z-[1000] bg-black/20 backdrop-blur-sm"
        onClick={handleCancel}
      >
        <div 
          className="fixed inset-y-0 right-0 w-[80vw] min-w-[350px] max-w-[800px] bg-[var(--bg-card)] shadow-dropdown border-l border-[var(--border-color)] p-6 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 text-[var(--text-secondary)]">Loading Topics...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[1000] bg-black/20 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <div 
        className="fixed inset-y-0 right-0 w-[80vw] min-w-[350px] max-w-[800px] bg-[var(--bg-card)] shadow-dropdown border-l border-[var(--border-color)] p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">New Entry</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TopicSelector
            topics={topics}
            selectedTopicId={selectedTopicId}
            onSelectTopic={setSelectedTopicId}
            onCreateNew={handleCreateTopic}
            isCreating={createTopicMutation.isPending}
            disabled={isSubmitting}
          />

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

          {area === 'ACTIVE' && (
            <StepEditor
              steps={steps}
              onChange={setSteps}
              disabled={isSubmitting}
            />
          )}

          <div className="flex gap-3 pt-4 border-t border-[var(--border-color)]">
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