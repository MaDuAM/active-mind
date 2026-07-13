// ============================================
// FILE: frontend/src/main.tsx
// PURPOSE: Application entry point - mounts React app with providers
// DEPENDENCIES: react, react-dom, tanstack/react-query, react-router-dom
// ============================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Tailwind CSS
import './index.css';

// ============================================
// QUERY CLIENT CONFIGURATION
// PURPOSE: Global React Query client with default settings
// ============================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ============================================
// APPLICATION MOUNT
// PROVIDER ORDER (outside-in):
// 1. BrowserRouter - routing
// 2. NotificationProvider - toast notifications
// 3. QueryClientProvider - server state management
// 4. AuthProvider - authentication state
// 5. App - root component
// ============================================
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);