// frontend/src/components/MenuOverlay.tsx

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSelectTrash?: () => void;
}

export function MenuOverlay({ 
  isOpen, 
  onClose, 
  darkMode, 
  onToggleDarkMode,
  onSelectTrash,
}: MenuOverlayProps) {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ============================================
  // Keyboard Shortcut: Escape closes menu
  // ============================================
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ============================================
  // Logout Handler
  // ============================================
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      onClose();
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ============================================
  // Trash Handler (mobile only)
  // ============================================
  const handleTrashClick = () => {
    if (onSelectTrash) {
      onSelectTrash();
      onClose();
    }
  };

  const avatarLetter = user?.username?.charAt(0).toUpperCase() || '?';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[300] bg-black/10 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed right-0 top-2 w-64 bg-[var(--bg-card)] shadow-dropdown z-[301] flex flex-col p-4 rounded-l-card animate-in fade-in slide-in-from-right duration-300 ease-out shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        
        {/* ============================================ */}
        {/* Header: User Info + Close Button */}
        {/* ============================================ */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gold-500 text-white font-semibold text-sm shrink-0 hover:scale-105 transition-transform duration-200">
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                {user?.username || 'User'}
              </div>
              <div className="text-xs text-[var(--text-muted)]">Logged in</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <hr className="border-[var(--border-color)] border-opacity-50" />

        {/* ============================================ */}
        {/* Dark Mode Toggle */}
        {/* ============================================ */}
        <div
          onClick={onToggleDarkMode}
          className="flex items-center justify-between px-3 py-3 rounded-button text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-base text-center">🌙</span>
            <span className="text-sm">Dark Mode</span>
          </div>
          <div
            className={`relative w-10 h-5 rounded-full transition-colors pointer-events-none ${
              darkMode ? 'bg-gold-500' : 'bg-[var(--border-color)]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        <hr className="border-[var(--border-color)] border-opacity-50" />

        {/* ============================================ */}
        {/* Trash Entry (mobile only) */}
        {/* Hidden on desktop since Trash is in sidebar */}
        {/* ============================================ */}
        <div className="sm:hidden">
          <div
            onClick={handleTrashClick}
            className="flex items-center gap-2 px-3 py-3 rounded-button text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition cursor-pointer"
          >
            <span className="w-6 shrink-0 text-base text-center">🗑️</span>
            <span className="text-sm">Removed Entries</span>
          </div>
          <hr className="border-[var(--border-color)] border-opacity-50" />
        </div>

        {/* ============================================ */}
        {/* Logout Button */}
        {/* ============================================ */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`flex items-center gap-2 px-3 py-3 rounded-button text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition text-left ${
            isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span className="w-6 shrink-0 text-base text-center text-error">⏻</span>
          <span className="text-sm font-bold">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>

        <div className="flex-1" />

        {/* ============================================ */}
        {/* Footer: App Version */}
        {/* ============================================ */}
        <div className="px-3 pt-2 text-xs text-[var(--text-muted)]">
          ActiveMind · v1.0 · {new Date().getFullYear()}
        </div>
      </div>
    </>
  );
}