import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dashboard } from '../Dashboard';

// Nur die nötigsten Mocks
vi.mock('../../hooks', () => ({
  usePaginatedEntries: vi.fn(() => ({
    data: { pages: [{ data: [], pagination: { hasNextPage: false, total: 0 } }] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    refetch: vi.fn(),
  })),
  useTopics: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

// NotificationProvider mocken (lightweight)
vi.mock('../../context/NotificationContext', () => ({
  useNotification: vi.fn(() => ({
    showNotification: vi.fn(),
  })),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// QueryClientProvider mocken
vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Dashboard', () => {
  it('renders dashboard header', () => {
    render(
      <Dashboard
        onOpenEntry={vi.fn()}
        showNewEntryForm={false}
        setShowNewEntryForm={vi.fn()}
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});