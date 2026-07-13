// ============================================
// FILE: frontend/src/context/AuthContext.tsx
// PURPOSE: Authentication state management with login, register, logout
// DEPENDENCIES: react, tanstack/react-query, apiClient, NotificationContext
// ============================================

import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotification } from './NotificationContext';
import { User } from '../types';
import { apiClient } from '../lib/apiClient';

// ============================================
// TYPES
// ============================================
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

// ============================================
// CONTEXT
// ============================================
const AuthContext = createContext<AuthContextType | null>(null);

// ============================================
// PROVIDER: AuthProvider
// ============================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  // ============================================
  // AUTH CHECK
  // PURPOSE: Validates session on app mount
  // OPTIMIZATION: Uses sessionStorage to prevent redundant requests on HMR/reload
  // ============================================
  useEffect(() => {
    // Skip if already checked in this session
    if (sessionStorage.getItem('auth_check_done') === 'true') {
      setLoading(false);
      return;
    }

    // Mark that check is running (prevents duplicate requests)
    sessionStorage.setItem('auth_check_done', 'true');

    apiClient
      .get<User>('/auth/me')
      .then((data) => {
        if (data?.id) setUser(data);
      })
      .catch(() => {
        // 401/404 → not logged in, silently ignore
        // No toast notification here - this is a background check
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ============================================
  // LOGIN
  // PURPOSE: Authenticates user credentials
  // BEHAVIOR: Sets user state, clears cache, shows welcome toast
  // ============================================
  const login = async (username: string, password: string) => {
    try {
      const user = await apiClient.post<User>('/auth/login', { username, password });
      setUser(user);
      // Clear cache on login to ensure fresh data
      queryClient.clear();
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
  // PURPOSE: Creates a new user account
  // BEHAVIOR: Auto-logs in on success, shows welcome toast
  // ============================================
  const register = async (username: string, password: string) => {
    try {
      const user = await apiClient.post<User>('/auth/register', { username, password });
      setUser(user);
      queryClient.clear();
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
  // PURPOSE: Destroys server-side session and clears client state
  // BEHAVIOR: Resets auth_check_done so next login triggers a fresh check
  // ============================================
  const logout = async () => {
    try {
      await apiClient.post<{ ok: true }>('/auth/logout');
      setUser(null);
      sessionStorage.removeItem('auth_check_done');
      queryClient.clear();
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

// ============================================
// HOOK: useAuth
// PURPOSE: Type-safe access to auth context
// THROWS: If used outside of AuthProvider
// ============================================
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};