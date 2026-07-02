// frontend/src/components/Sidebar.tsx

import { useState, useEffect } from 'react';
import { useTopics } from '../hooks';
import { Topic } from '../types';

interface SidebarProps {
  onSelectTopic: (topicId: number | null) => void;
  onSelectTrash: () => void;
  selectedView: 'dashboard' | 'topic' | 'trash';
  selectedTopicId?: number | null;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ 
  onSelectTopic, 
  onSelectTrash, 
  selectedView, 
  selectedTopicId,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      return width >= 768 && width < 1024;
    }
    return false;
  });
  const { data: topics = [], isLoading } = useTopics();

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 768 && width < 1024) {
        setCollapsed(true);
      } else if (width >= 1024) {
        setCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================
  // MOBILE: Overlay
  // ============================================
  if (isMobileOpen) {
    return (
      <>
        <div 
          className="fixed inset-0 z-[300] bg-black/30 backdrop-blur-sm"
          onClick={onMobileClose}
        />
        <div className="fixed inset-0 z-[301] bg-[var(--bg-card)] flex flex-col animate-in fade-in slide-in-from-bottom duration-300">
          <div className="shrink-0 px-4 py-4 border-b border-[var(--border-color)] flex items-center justify-start">
            <span className="text-xl font-semibold text-gold-500">
              Topics
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="space-y-1">
              {/* Dashboard ENTFERN – nur noch Topics */}
              {topics.map((topic: Topic) => (
                <div
                  key={topic.id}
                  onClick={() => {
                    onSelectTopic(topic.id);
                    if (onMobileClose) onMobileClose();
                  }}
                  className={`cursor-pointer rounded-button px-2.5 py-2 text-sm transition-all duration-200 ${
                    selectedView === 'topic' && selectedTopicId === topic.id
                      ? 'bg-gold-500 text-white'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] hover:-translate-y-0.5'
                  }`}
                >
                  {topic.name}
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 px-4 py-4 flex justify-center border-t border-[var(--border-color)]">
            <button
              onClick={onMobileClose}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-gold-500 hover:text-white transition-colors text-2xl"
              aria-label="Close topics"
            >
              ✕
            </button>
          </div>
        </div>
      </>
    );
  }

  // ============================================
  // DESKTOP
  // ============================================
  if (isLoading) {
    return (
      <aside
        className={`hidden sm:block h-full border-r border-[var(--border-color)] bg-[var(--bg-primary)] p-3 transition-all duration-200 flex flex-col ${
          collapsed ? 'w-[68px]' : 'w-[210px]'
        } shadow-[2px_0_8px_-2px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_8px_-2px_rgba(255,255,255,0.05)]`}
      >
        <div className="text-sm text-[var(--text-secondary)]">Loading Topics...</div>
      </aside>
    );
  }

  const topicItems = topics.map((topic: Topic) => (
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

  return (
    <aside
      className={`hidden sm:flex h-full flex-col border-r border-[var(--border-color)] bg-[var(--bg-primary)] p-3 transition-all duration-200 ${
        collapsed ? 'w-[68px]' : 'w-[210px]'
      } shadow-[2px_0_8px_-2px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_8px_-2px_rgba(255,255,255,0.05)]`}
    >
      {/* Dashboard - fix oben */}
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

      <hr className="border-[var(--border-color)] my-3 shrink-0" />

      {/* Scrollbarer Bereich: Topics-Überschrift + Liste */}
      <div className="flex-1 min-h-0 overflow-y-auto -mr-3 pr-3">
        <div className="space-y-1 pb-2">
          {/* Topics-Überschrift + Collapse-Button */}
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

          {/* Topics-Liste */}
          <div className="space-y-1">{topicItems}</div>
        </div>
      </div>

      {/* Papierkorb – fix am unteren Rand */}
      <div className="shrink-0 pt-3 border-t border-[var(--border-color)] mt-1">
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