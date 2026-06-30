// frontend/src/context/AuthContext.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import { useNotification } from './NotificationContext';
import { User } from '../types';
import { apiClient } from '../lib/apiClient';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  // ============================================
  // AUTH CHECK: Nur einmal pro Session (auch bei StrictMode / HMR)
  // ============================================
  useEffect(() => {
    // Prüfen ob bereits in dieser Session geprüft wurde
    if (sessionStorage.getItem('auth_check_done') === 'true') {
      setLoading(false);
      return;
    }

    // Markieren dass Check läuft
    sessionStorage.setItem('auth_check_done', 'true');

    apiClient
      .get<User>('/auth/me')
      .then((data) => {
        if (data?.id) setUser(data);
      })
      .catch(() => {
        // 401/404 → nicht eingeloggt, still ignorieren (kein Toast)
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ============================================
  // LOGIN
  // ============================================
  const login = async (username: string, password: string) => {
    try {
      const user = await apiClient.post<User>('/auth/login', { username, password });
      setUser(user);
      showNotification('success', `Welcome back, ${user.username}!`);
    } catch (error) {
      if (error instanceof Error) {
        showNotification('error', error.message);
      }
      throw error;
    }
  };

  // ============================================
  // REGISTER
  // ============================================
  const register = async (username: string, password: string) => {
    try {
      const user = await apiClient.post<User>('/auth/register', { username, password });
      setUser(user);
      showNotification('success', `Account created! Welcome, ${user.username}!`);
    } catch (error) {
      if (error instanceof Error) {
        showNotification('error', error.message);
      }
      throw error;
    }
  };

  // ============================================
  // LOGOUT
  // ============================================
  const logout = async () => {
    try {
      await apiClient.post<{ ok: true }>('/auth/logout');
      setUser(null);
      sessionStorage.removeItem('auth_check_done'); // Zurücksetzen für nächsten Login
      showNotification('info', 'Logged out successfully');
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};