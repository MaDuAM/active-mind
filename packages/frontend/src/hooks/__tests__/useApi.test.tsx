import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePaginatedEntries, useCreateEntry } from '../useApi';
import { server } from '../../test/setup';
import { http, HttpResponse } from 'msw';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePaginatedEntries', () => {
  it('fetches entries successfully', async () => {
    server.use(
      http.get('/api/v1/entries', () => {
        return HttpResponse.json({
          data: [{ id: 1, essenceShort: 'Test Entry' }],
          pagination: { page: 1, limit: 50, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
        });
      })
    );

    const { result } = renderHook(() => usePaginatedEntries({}, true), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].data[0].essenceShort).toBe('Test Entry');
  });
});

describe('useCreateEntry', () => {
  it('creates entry successfully', async () => {
    const newEntry = {
      area: 'KNOWLEDGE' as const,
      topicId: 1,
      essenceText: 'Test Essence',
      essenceShort: 'Test Short',
    };

    server.use(
      http.post('/api/v1/entries', async ({ request }) => {
        const body = await request.json();
        expect(body).toMatchObject(newEntry);
        return HttpResponse.json({
          id: 42,
          ...newEntry,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: 1,
        });
      })
    );

    const { result } = renderHook(() => useCreateEntry(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newEntry);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({
      id: 42,
      essenceText: 'Test Essence',
    });
  });
});