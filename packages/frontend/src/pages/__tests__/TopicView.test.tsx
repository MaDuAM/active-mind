import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TopicView from '../TopicView';

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
    data: [{ id: 1, name: 'Test Topic' }],
    isLoading: false,
  })),
  useDeleteTopic: vi.fn(() => ({
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

describe('TopicView', () => {
  it('renders topic name', () => {
    render(
      <TopicView
        topicId={1}
        onOpenEntry={vi.fn()}
        onTopicDeleted={vi.fn()}
        showNewEntryForm={false}
        setShowNewEntryForm={vi.fn()}
      />
    );

    expect(screen.getByText('Test Topic')).toBeInTheDocument();
  });
});