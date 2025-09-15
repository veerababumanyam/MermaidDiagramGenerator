
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './src/components/ErrorBoundary';
import { env } from './src/utils/env';

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);

  // Report to monitoring service in production
  if (env.NODE_ENV === 'production') {
    // TODO: Send to error monitoring service
  }

  // Prevent the default browser behavior (logging to console)
  event.preventDefault();
});

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);

  // Report to monitoring service in production
  if (env.NODE_ENV === 'production') {
    // TODO: Send to error monitoring service
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
