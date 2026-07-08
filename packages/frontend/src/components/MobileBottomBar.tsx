// frontend/src/components/MobileBottomBar.tsx

import { useAuth } from '../context/AuthContext';

interface MobileBottomBarProps {
  onSearch: () => void;
  onDashboard: () => void;
  onTopics: () => void;
  onNewEntry: () => void;
  onMenu: () => void;
}

export function MobileBottomBar({
  onSearch,
  onDashboard,
  onTopics,
  onNewEntry,
  onMenu,
}: MobileBottomBarProps) {
  const { user } = useAuth();

  // Only show when user is logged in
  if (!user) return null;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-card)] border-t border-[var(--border-color)] flex items-center justify-around px-2 py-1.5 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(255,255,255,0.05)]">
      
      {/* Search Button */}
      <button
        onClick={onSearch}
        className="flex flex-col items-center justify-center w-12 h-12 text-[var(--text-muted)] hover:text-gold-500 transition-colors"
        aria-label="Search"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="text-[10px]">Search</span>
      </button>

      {/* Dashboard Button */}
      <button
        onClick={onDashboard}
        className="flex flex-col items-center justify-center w-12 h-12 text-[var(--text-muted)] hover:text-gold-500 transition-colors"
        aria-label="Dashboard"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span className="text-[10px]">Dashboard</span>
      </button>

      {/* New Entry Button (FAB style - raised) */}
      <button
        onClick={onNewEntry}
        className="flex flex-col items-center justify-center w-12 h-12 -mt-4 bg-gold-500 text-white rounded-full shadow-md hover:bg-gold-600 transition-colors"
        aria-label="New Entry"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Topics Button */}
      <button
        onClick={onTopics}
        className="flex flex-col items-center justify-center w-12 h-12 text-[var(--text-muted)] hover:text-gold-500 transition-colors"
        aria-label="Topics"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h10M4 18h6" />
        </svg>
        <span className="text-[10px]">Topics</span>
      </button>

      {/* Menu Button */}
      <button
        onClick={onMenu}
        className="flex flex-col items-center justify-center w-12 h-12 text-[var(--text-muted)] hover:text-gold-500 transition-colors"
        aria-label="Menu"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
        <span className="text-[10px]">Menu</span>
      </button>
    </div>
  );
}