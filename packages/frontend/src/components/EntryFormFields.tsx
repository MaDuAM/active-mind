// frontend/src/components/EntryFormFields.tsx

import { Area, Status } from '../types';

interface EntryFormFieldsProps {
  area: Area;
  essenceText: string;
  essenceShort: string;
  actionName: string;
  benefit: string;
  status: Status;
  pauseReason: string;
  onEssenceTextChange: (value: string) => void;
  onEssenceShortChange: (value: string) => void;
  onActionNameChange: (value: string) => void;
  onBenefitChange: (value: string) => void;
  onStatusChange: (value: Status) => void;
  onPauseReasonChange: (value: string) => void;
  disabled?: boolean;
}

export function EntryFormFields({
  area,
  essenceText,
  essenceShort,
  actionName,
  benefit,
  status,
  pauseReason,
  onEssenceTextChange,
  onEssenceShortChange,
  onActionNameChange,
  onBenefitChange,
  onStatusChange,
  onPauseReasonChange,
  disabled = false,
}: EntryFormFieldsProps) {
  return (
    <>
      {/* Essence Text */}
      <div>
        <label className="label">Essence Text *</label>
        <textarea
          maxLength={5000}
          value={essenceText}
          onChange={(e) => onEssenceTextChange(e.target.value)}
          className="input"
          rows={4}
          disabled={disabled}
          placeholder="Detailed description..."
        />
        <div className="text-xs text-[var(--text-muted)] mt-1 text-right">
          {essenceText.length}/5000
        </div>
      </div>

      {/* Essence Short */}
      <div>
        <label className="label">Essence Short *</label>
        <input
          maxLength={500}
          value={essenceShort}
          onChange={(e) => onEssenceShortChange(e.target.value)}
          className="input"
          disabled={disabled}
          placeholder="Short summary..."
        />
        <div className="text-xs text-[var(--text-muted)] mt-1 text-right">
          {essenceShort.length}/500
        </div>
      </div>

      {/* Area-specific fields */}
      {area !== 'KNOWLEDGE' && (
        <>
          <div>
            <label className="label">Action Name *</label>
            <input
              maxLength={30}
              value={actionName}
              onChange={(e) => onActionNameChange(e.target.value)}
              className="input"
              disabled={disabled}
              placeholder="What action to take..."
            />
            <div className="text-xs text-[var(--text-muted)] mt-1 text-right">
              {actionName.length}/30
            </div>
          </div>

          <div>
            <label className="label">Benefit</label>
            <input
              maxLength={500}
              value={benefit}
              onChange={(e) => onBenefitChange(e.target.value)}
              className="input"
              disabled={disabled}
              placeholder="What's the benefit?"
            />
            <div className="text-xs text-[var(--text-muted)] mt-1 text-right">
              {benefit.length}/500
            </div>
          </div>

          <div>
            <label className="label">Start Status</label>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as Status)}
              className="input"
              disabled={disabled}
            >
              <option value="WAITING">Waiting</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>

          {status === 'WAITING' && (
            <div>
              <label className="label">Reason for Waiting *</label>
              <input
                maxLength={500}
                value={pauseReason}
                onChange={(e) => onPauseReasonChange(e.target.value)}
                className="input"
                disabled={disabled}
                placeholder="Why is this waiting?"
              />
              <div className="text-xs text-[var(--text-muted)] mt-1 text-right">
                {pauseReason.length}/500
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}