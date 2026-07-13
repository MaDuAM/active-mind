// ============================================
// FILE: frontend/src/components/Login.tsx
// PURPOSE: Login and registration form with toggle between modes
// DEPENDENCIES: react, AuthContext, NotificationContext
// ============================================

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

// ============================================
// COMPONENT: Login
// ============================================
export function Login() {
  // ============================================
  // FORM STATE
  // ============================================
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();
  const { showNotification } = useNotification();

  // ============================================
  // FORM SUBMISSION HANDLER
  // PURPOSE: Handles both login and register flows
  //   - Login: Authenticates existing user
  //   - Register: Creates new account, auto-login on success
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (isRegisterMode) {
        // Register: Validate password match
        if (password !== passwordConfirm) {
          showNotification('error', 'Passwords do not match');
          return;
        }
        await register(username, password);
      } else {
        // Login: Authenticate user
        await login(username, password);
      }
    } catch (_error) {
      // Error is already handled by AuthContext via toast notification
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="h-screen flex items-center justify-center bg-[var(--bg-secondary)] px-4">
      <div className="w-full max-w-md bg-[var(--bg-card)] rounded-card shadow-card p-8 border border-[var(--border-color)] -mt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gold-500 tracking-tight">
            {isRegisterMode ? 'Create Account' : 'ActiveMind'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isRegisterMode ? 'Create new user' : 'Sign in with your account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="username" className="label">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              placeholder="e.g., peter.parker"
              required
              disabled={isSubmitting}
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
              disabled={isSubmitting}
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
            />
          </div>

          {/* Password Confirm (only in register mode) */}
          {isRegisterMode && (
            <div>
              <label htmlFor="password-confirm" className="label">
                Confirm Password
              </label>
              <input
                id="password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
                disabled={isSubmitting}
                autoComplete="new-password"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary py-2.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? 'Loading ...'
              : isRegisterMode
              ? 'Register'
              : 'Sign In'}
          </button>

          {/* Toggle Mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                // Reset password fields when switching modes
                setPasswordConfirm('');
                setPassword('');
              }}
              className="text-sm text-gold-500 hover:text-gold-600 transition-colors"
              disabled={isSubmitting}
            >
              {isRegisterMode
                ? '← Back to Login'
                : 'Create new account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}