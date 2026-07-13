// ============================================
// FILE: frontend/src/components/Toast.tsx
// PURPOSE: Toast notification display with auto-dismiss
// DEPENDENCIES: react, NotificationContext
// ============================================

import { useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';

// ============================================
// COMPONENT: Toast
// ============================================
export function Toast() {
  const { notifications, removeNotification } = useNotification();

  // ============================================
  // AUTO-DISMISS
  // PURPOSE: Removes notifications after 5 seconds
  // ============================================
  useEffect(() => {
    const timers = notifications.map((n) => {
      const timer = setTimeout(() => removeNotification(n.id), 5000);
      return timer;
    });
    return () => timers.forEach(clearTimeout);
  }, [notifications, removeNotification]);

  // No notifications to display
  if (notifications.length === 0) return null;

  // ============================================
  // HELPER: Get border color based on notification type
  // ============================================
  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      case 'warning':
        return 'border-amber-500';
      case 'info':
        return 'border-gold-400';
      default:
        return 'border-[var(--border-color)]';
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full items-end">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`bg-white dark:bg-gray-800 border-l-4 ${getBorderColor(n.type)} rounded-card shadow-dropdown px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top-5 duration-200 w-full`}
        >
          {/* Message */}
          <span className="text-sm text-[var(--text-primary)] flex-1 text-center">
            {n.message}
          </span>

          {/* Close Button */}
          <button
            onClick={() => removeNotification(n.id)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition shrink-0 text-lg leading-none"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}