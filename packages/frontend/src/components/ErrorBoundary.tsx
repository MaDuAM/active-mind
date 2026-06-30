// frontend/src/components/ErrorBoundary.tsx

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

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
              Neu laden
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

    return this.props.children;
  }
}