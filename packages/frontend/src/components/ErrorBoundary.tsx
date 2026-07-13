// ============================================
// FILE: frontend/src/components/ErrorBoundary.tsx
// PURPOSE: Catches JavaScript errors in child component tree and displays fallback UI
// DEPENDENCIES: react
// ============================================

import { Component, ReactNode } from 'react';

// ============================================
// PROPS & STATE
// ============================================
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ============================================
// COMPONENT: ErrorBoundary
// FEATURES:
//   - Renders fallback UI when error occurs
//   - Logs errors to console
//   - Optional custom error handler callback
//   - Reset functionality to recover from errors
// ============================================
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  // ============================================
  // getDerivedStateFromError
  // PURPOSE: Updates state when error is thrown in child component
  // ============================================
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  // ============================================
  // componentDidCatch
  // PURPOSE: Logs error and calls optional onError callback
  // ============================================
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  // ============================================
  // handleReset
  // PURPOSE: Resets error state to recover from error
  // ============================================
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    // Error State: Render fallback UI
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="p-10 m-5 max-w-xl mx-auto text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-card">
          <h2 className="text-error font-semibold text-xl mt-0">Something went wrong.</h2>
          <p className="text-[var(--text-secondary)] mb-5">
            {this.state.error?.message || 'An unexpected error has occurred.'}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="btn-primary"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    // No Error: Render children normally
    return this.props.children;
  }
}