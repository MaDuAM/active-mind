// frontend/src/components/TopicSelector.tsx

import { useState } from 'react';
import { Topic } from '../types';

interface TopicSelectorProps {
  topics: Topic[];
  selectedTopicId: number | null;
  onSelectTopic: (topicId: number) => void;
  onCreateNew: (name: string) => void;
  isCreating?: boolean;
  disabled?: boolean;
  label?: string;
}

export function TopicSelector({
  topics,
  selectedTopicId,
  onSelectTopic,
  onCreateNew,
  isCreating = false,
  disabled = false,
  label = 'Topic Block',
}: TopicSelectorProps) {
  const [createNew, setCreateNew] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setCreateNew(true);
      setNewTopicName('');
    } else if (value === '') {
      // Empty value → do nothing
      return;
    } else {
      setCreateNew(false);
      onSelectTopic(Number(value));
    }
  };

  const handleCreateNew = () => {
    if (newTopicName.trim()) {
      onCreateNew(newTopicName.trim());
      setNewTopicName('');
      setCreateNew(false);
    }
  };

  const handleCancelNew = () => {
    setCreateNew(false);
    setNewTopicName('');
  };

  return (
    <div>
      <label className="label">{label}</label>
      {!createNew ? (
        <select
          value={selectedTopicId ?? ''}
          onChange={handleSelectChange}
          className="input"
          disabled={disabled || isCreating}
        >
          <option value="" disabled>
            Select existing Topic Block
          </option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
          <option value="new">+ New Topic Block</option>
        </select>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Name of the new Topic Block"
            maxLength={100}
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            className="input flex-1"
            disabled={disabled || isCreating}
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateNew}
            disabled={!newTopicName.trim() || disabled || isCreating}
            className="btn-primary whitespace-nowrap"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
          <button
            type="button"
            onClick={handleCancelNew}
            disabled={disabled || isCreating}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}