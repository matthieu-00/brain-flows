import React from 'react';
import { Brain, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  onReset?: () => void;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-cream-50 dark:bg-neutral-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-400 mb-6">
              <Brain className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-text">
              {this.props.title ?? 'Something went sideways'}
            </h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-textMuted">
              {this.props.description ?? 'A quick refresh usually sorts it out.'}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-sage-300 dark:border-sage-600 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm font-medium text-sage-800 dark:text-sage-400 hover:bg-sage-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Give it another go
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
