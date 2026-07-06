// frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { Toast } from './components/Toast';
import { useNotification } from './context/NotificationContext';
import { BrowserRouter } from 'react-router-dom';

// Tailwind CSS
import './index.css';

// Global query client with centralized error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Error handler for React Query - IGNORES AUTH ERRORS
function QueryErrorHandler() {
  const { showNotification } = useNotification();
  
  React.useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.action?.type === 'error') {
        const error = event.action?.error;
        if (error instanceof Error) {
          // Ignore authentication errors (401, 403) - they are handled by AuthContext
          if (error.message.includes('401') || 
              error.message.includes('403') || 
              error.message.includes('Not authenticated') ||
              error.message.includes('Unauthorized')) {
            return;
          }
          showNotification('error', error.message || 'An error occurred');
        }
      }
    });
    return () => unsubscribe();
  }, [showNotification]);

  return null;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <QueryErrorHandler />
            <App />
            <Toast />
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);