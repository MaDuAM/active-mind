// ============================================
// FILE: frontend/src/context/NotificationContext.tsx
// PURPOSE: Toast notification state management
// DEPENDENCIES: react
// ============================================

import { createContext, useContext, useState, ReactNode } from 'react';

// ============================================
// TYPES
// ============================================
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (type: Notification['type'], message: string) => void;
  removeNotification: (id: string) => void;
}

// ============================================
// CONSTANTS
// ============================================
const MAX_NOTIFICATIONS = 5; // Prevents UI flooding

// ============================================
// CONTEXT
// ============================================
const NotificationContext = createContext<NotificationContextType | null>(null);

// ============================================
// PROVIDER: NotificationProvider
// ============================================
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ============================================
  // showNotification
  // PURPOSE: Adds a new toast notification
  // BEHAVIOR: Generates unique ID, limits to MAX_NOTIFICATIONS
  // ============================================
  const showNotification = (type: Notification['type'], message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setNotifications(prev => {
      const updated = [...prev, { id, type, message }];
      return updated.slice(-MAX_NOTIFICATIONS);
    });
  };

  // ============================================
  // removeNotification
  // PURPOSE: Removes a notification by ID
  // ============================================
  const removeNotification = (id: string) => {
    setNotifications(prev => {
      return prev.filter(n => n.id !== id);
    });
  };

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

// ============================================
// HOOK: useNotification
// PURPOSE: Type-safe access to notification context
// THROWS: If used outside of NotificationProvider
// ============================================
export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};