// frontend/src/context/NotificationContext.tsx

import { createContext, useContext, useState, ReactNode } from 'react';

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

const NotificationContext = createContext<NotificationContextType | null>(null);

// ============================================
// MAXIMALE ANZAHL TOASTS (verhindert UI-Überflutung)
// ============================================
const MAX_NOTIFICATIONS = 5;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (type: Notification['type'], message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => {
      const updated = [...prev, { id, type, message }];
      // Nur MAX_NOTIFICATIONS behalten (älteste fallen weg)
      return updated.slice(-MAX_NOTIFICATIONS);
    });
    setTimeout(() => removeNotification(id), 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};