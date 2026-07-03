import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EntryDetail from '../EntryDetail';

vi.mock('../../hooks', () => ({
  useEntry: vi.fn(() => ({
    data: {
      id: 1,
      essenceText: 'Test Essence',
      essenceShort: 'Test Short',
      area: 'KNOWLEDGE',
      actionName: 'Test Action',
      status: 'ACTIVE',
      topicId: 1,
      userId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trackings: [],
    },
    isLoading: false,
    refetch: vi.fn(),
  })),
  useStatusChange: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useStepChange: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useUpdateEntry: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useDeleteEntry: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useManualTracking: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('../../context/NotificationContext', () => ({
  useNotification: vi.fn(() => ({
    showNotification: vi.fn(),
  })),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('EntryDetail', () => {
  it('renders entry data', () => {
    render(<EntryDetail entryId={1} onClose={vi.fn()} />);

    expect(screen.getByText('Test Action')).toBeInTheDocument();
    expect(screen.getByText('Test Essence')).toBeInTheDocument();
    expect(screen.getByText('Test Short')).toBeInTheDocument();
  });
});