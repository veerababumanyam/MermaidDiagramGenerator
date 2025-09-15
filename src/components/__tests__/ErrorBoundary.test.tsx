/**
 * Unit tests for ErrorBoundary component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from '../ErrorBoundary';

// Mock console methods
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    consoleErrorSpy.mockClear();
    consoleLogSpy.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  // Component that throws an error
  const ErrorComponent = () => {
    throw new Error('Test error');
  };

  // Normal component
  const NormalComponent = () => <div>Normal Component</div>;

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Component')).toBeInTheDocument();
  });

  it('should render error UI when error occurs', () => {
    // Suppress console error for this test
    const originalError = console.error;
    console.error = jest.fn();

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();

    console.error = originalError;
  });

  it('should show custom fallback when provided', () => {
    const customFallback = <div>Custom Error Fallback</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error Fallback')).toBeInTheDocument();
  });

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle retry functionality', () => {
    let renderCount = 0;

    const RetryComponent = () => {
      renderCount++;
      if (renderCount === 1) {
        throw new Error('Test error');
      }
      return <div>Recovered Component</div>;
    };

    render(
      <ErrorBoundary>
        <RetryComponent />
      </ErrorBoundary>
    );

    // Click retry button
    fireEvent.click(screen.getByText('Try Again'));

    expect(screen.getByText('Recovered Component')).toBeInTheDocument();
  });

  it('should handle reload functionality', () => {
    // Mock window.location.reload
    const reloadSpy = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Reload Page'));

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('should log errors to console', () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

describe('withErrorBoundary HOC', () => {
  it('should wrap component with error boundary', () => {
    const TestComponent = () => <div>Test Component</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should set display name correctly', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';

    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });
});

