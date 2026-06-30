// frontend/src/components/Sidebar.tsx

import { useState, useMemo } from 'react';
import { useTopics } from '../hooks';
import { Topic } from '../types';

interface SidebarProps {
  onSelectTopic: (topicId: number | null) => void;
  onSelectTrash: () => void;
  selectedView: 'dashboard' | 'topic' | 'trash';
  selectedTopicId?: number | null;
}

export function Sidebar({ 
  onSelectTopic, 
  onSelectTrash, 
  selectedView, 
  selectedTopicId 
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { data: topics = [], isLoading } = useTopics();

  const topicItems = useMemo(() => {
    return topics.map((topic: Topic) => (
      <div
        key={topic.id}
        onClick={() => onSelectTopic(topic.id)}
        className={`cursor-pointer rounded-button px-2.5 py-2 text-sm transition-all duration-200 mr-1 ${
          selectedView === 'topic' && selectedTopicId === topic.id
            ? 'bg-gold-500 text-white'
            : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] hover:-translate-y-0.5'
        } ${collapsed ? 'text-center' : ''}`}
      >
        {collapsed ? '📄' : topic.name}
      </div>
    ));
  }, [topics, selectedView, selectedTopicId, collapsed, onSelectTopic]);

  if (isLoading) {
    return (
      <aside
        className={`h-full border-r border-[var(--border-color)] bg-[var(--bg-primary)] p-3 transition-all duration-200 flex flex-col ${
          collapsed ? 'w-[68px]' : 'w-[210px]'
        } shadow-[2px_0_8px_-2px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_8px_-2px_rgba(255,255,255,0.05)]`}
      >
        <div className="text-sm text-[var(--text-secondary)]">Loading Topics...</div>
      </aside>
    );
  }

  return (
    <aside
      className={`h-full border-r border-[var(--border-color)] bg-[var(--bg-primary)] p-3 transition-all duration-200 flex flex-col ${
        collapsed ? 'w-[68px]' : 'w-[210px]'
      } shadow-[2px_0_8px_-2px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_8px_-2px_rgba(255,255,255,0.05)]`}
    >
      {/* Dashboard */}
      <div className="shrink-0">
        <div
          onClick={() => onSelectTopic(null)}
          className={`cursor-pointer rounded-button px-2.5 py-2 transition-all duration-200 font-semibold mr-1 ${
            selectedView === 'dashboard'
              ? 'bg-gold-500 text-white'
              : 'text-gold-500 hover:bg-gold-500 hover:text-white hover:-translate-y-0.5'
          }`}
        >
          {collapsed ? '✨' : '✨ Dashboard'}
        </div>
      </div>

      {/* Trennlinie */}
      <hr className="border-[var(--border-color)] my-3 shrink-0" />

      {/* Topics-Überschrift + Einklapp-Button */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {collapsed ? '' : 'Topics'}
        </span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors text-sm font-mono"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          <span className={collapsed ? 'translate-x-[1.25px]' : 'translate-x-[-1.25px]'}>
            {collapsed ? '⫸' : '⫷'}
          </span>
        </button>
      </div>

      {/* Topics-Liste (scrollbar) */}
      <div className="flex-1 overflow-y-auto min-h-0 -mr-3 pr-3">
        <div className="space-y-1 pb-2">{topicItems}</div>
      </div>

      {/* Trennlinie + Verlauf kombiniert */}
      <div className="relative shrink-0">
        {/* Verlauf – oberhalb der Trennlinie */}
        <div className="absolute bottom-full left-0 right-0 h-8 bg-gradient-to-t from-[var(--bg-card)] to-transparent pointer-events-none" />
        {/* Trennlinie */}
        <hr className="border-[var(--border-color)] my-1" />
      </div>

      {/* Papierkorb */}
      <div className="shrink-0 pt-1">
        <div
          onClick={onSelectTrash}
          className={`cursor-pointer rounded-button px-2.5 py-1.5 text-xs transition-all duration-200 mr-1 ${
            selectedView === 'trash'
              ? 'bg-gold-500 text-white'
              : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:-translate-y-0.5'
          }`}
        >
          {collapsed ? '🗑️' : '🗑️ Removed Entries'}
        </div>
      </div>
    </aside>
  );
}