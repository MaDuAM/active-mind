// ============================================
// FILE: frontend/src/hooks/useApi.ts
// PURPOSE: React Query hooks for all API interactions
// DEPENDENCIES: tanstack/react-query, apiClient, types
// ============================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Entry, Topic, Tracking, CreateEntryPayload, Step } from '../types';
import { apiClient } from '../lib/apiClient';

// ============================================
// QUERY KEYS
// PURPOSE: Centralized cache keys for React Query
// Enables consistent invalidation across hooks
// ============================================
export const queryKeys = {
  entry: (id: number) => ['entry', id] as const,
  topics: () => ['topics'] as const,
};

// ============================================
// API FETCH FUNCTIONS
// Thin wrappers around apiClient with typed responses
// ============================================

const api = {
  // GET /entries - Paginated entry list with filters
  getEntries: async (filters?: {
    topicId?: number;
    area?: string;
    status?: string;
    deletedOnly?: boolean;
    page?: number;
    limit?: number;
  }) => {
    return apiClient.get<{
      data: Entry[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    }>('/entries', filters);
  },

  // GET /entries/:id - Single entry with tracking history
  getEntry: async (id: number) => {
    return apiClient.get<Entry & { trackings: Tracking[] }>(`/entries/${id}`);
  },

  // GET /topics - All topics for current user
  getTopics: async () => {
    return apiClient.get<Topic[]>('/topics');
  },

  /**
   * Fetch entries grouped by section (active, passive, waiting, paused, knowledge)
   * @param topicId - Optional topic ID filter
   * @returns Object with sections as keys
   */
  getEntriesBySection: async (topicId?: number) => {
    return apiClient.get<{
      active: Entry[];
      passive: Entry[];
      waiting: Entry[];
      paused: Entry[];
      knowledge: Entry[];
    }>('/entries/by-section', topicId ? { topicId } : undefined);
  },

  // POST /entries - Create new entry
  createEntry: async (data: CreateEntryPayload) => {
    return apiClient.post<Entry>('/entries', data);
  },

  // PUT /entries/:id - Update existing entry
  updateEntry: async ({ id, ...data }: {
    id: number;
    essenceText?: string;
    essenceShort?: string;
    actionName?: string;
    benefit?: string;
    steps?: Step[];
    changeNote?: string;
  }) => {
    return apiClient.put<Entry>(`/entries/${id}`, data);
  },

  // DELETE /entries/:id - Soft delete (move to trash)
  deleteEntry: async (id: number) => {
    return apiClient.delete<{ ok: true }>(`/entries/${id}`);
  },

  // POST /entries/:id/restore - Restore from trash
  restoreEntry: async (id: number) => {
    return apiClient.post<{ ok: true }>(`/entries/${id}/restore`);
  },

  // DELETE /entries/:id/permanent - Permanently delete
  permanentDeleteEntry: async (id: number) => {
    return apiClient.delete<{ ok: true }>(`/entries/${id}/permanent`);
  },

  // POST /entries/:id/status - Change status
  changeStatus: async ({ id, newStatus, note }: { id: number; newStatus: string; note?: string }) => {
    return apiClient.post<{ ok: true }>(`/entries/${id}/status`, { newStatus, note });
  },

  // POST /entries/:id/step - Change current step
  changeStep: async ({ id, newStepIndex, note }: { id: number; newStepIndex: number; note?: string }) => {
    return apiClient.post<{ ok: true }>(`/entries/${id}/step`, { newStepIndex, note });
  },

  // POST /entries/:id/tracking/manual - Add manual tracking
  addManualTracking: async ({ id, timestamp, note }: { id: number; timestamp: string; note?: string }) => {
    return apiClient.post<{ ok: true }>(`/entries/${id}/tracking/manual`, { timestamp, note });
  },

  // POST /topics - Create new topic
  createTopic: async (name: string) => {
    return apiClient.post<Topic>('/topics', { name });
  },

  // DELETE /topics/:id - Delete topic
  deleteTopic: async (id: number) => {
    return apiClient.delete<{ ok: true }>(`/topics/${id}`);
  },

  // PATCH /entries/:id/favorite - Toggle favorite
  toggleFavorite: async (id: number) => {
    return apiClient.patch<{ id: number; isFavorite: boolean }>(`/entries/${id}/favorite`);
  },
};

// ============================================
// QUERY HOOKS
// ============================================

// usePaginatedEntries - Infinite query for scroll-based loading
export const usePaginatedEntries = (
  filters?: {
    topicId?: number;
    area?: string;
    status?: string;
    deletedOnly?: boolean;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  },
  enabled: boolean = true
) => {
  const limit = filters?.limit || 1000;

  return useInfiniteQuery({
    queryKey: ['entries-paginated', { ...filters, limit }],
    queryFn: ({ pageParam = 1 }) =>
      api.getEntries({
        ...filters,
        page: pageParam,
        limit,
      }),
    getNextPageParam: (lastPage) => {
      const { page, hasNextPage } = lastPage.pagination;
      return hasNextPage ? page + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      const { page, hasPrevPage } = firstPage.pagination;
      return hasPrevPage ? page - 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30000,
    enabled,
  });
};

// useEntry - Fetch single entry with trackings
export const useEntry = (id: number) => {
  return useQuery({
    queryKey: queryKeys.entry(id),
    queryFn: () => api.getEntry(id),
    enabled: !!id,
  });
};

// useTopics - Fetch all topics for current user
export const useTopics = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.topics(),
    queryFn: api.getTopics,
    staleTime: 300000, // 5 minutes - topics rarely change
    enabled,
  });
};

/**
 * Fetch entries grouped by section (active, passive, waiting, paused, knowledge)
 * @param topicId - Optional topic ID filter
 * @param enabled - Whether the query should run
 * @returns Query result with sections
 */
export const useEntriesBySection = (topicId?: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['entries-by-section', topicId],
    queryFn: () => api.getEntriesBySection(topicId),
    enabled,
    staleTime: 30000,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

// useStatusChange - Change entry status
export const useStatusChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.changeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

// useStepChange - Change current step index
export const useStepChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.changeStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

// useDeleteEntry - Soft delete entry
export const useDeleteEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

// useRestoreEntry - Restore from trash
export const useRestoreEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.restoreEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

// useUpdateEntry - Update entry fields
export const useUpdateEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateEntry,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.entry(data.id) });
    },
  });
};

// useCreateEntry - Create new entry
export const useCreateEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

// usePermanentDeleteEntry - Permanently delete entry
export const usePermanentDeleteEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.permanentDeleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

// useManualTracking - Add manual tracking entry
export const useManualTracking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.addManualTracking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

// useCreateTopic - Create new topic
export const useCreateTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.topics() });
    },
  });
};

// useDeleteTopic - Delete topic (only when empty)
export const useDeleteTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.topics() });
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

// useToggleFavorite - Toggle favorite status
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.toggleFavorite,
    onSuccess: (data) => {
      // Optimistic update: manually update cache
      queryClient.setQueryData(
        ['entries-paginated'],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.map((entry: Entry) =>
                entry.id === data.id
                  ? { ...entry, isFavorite: data.isFavorite }
                  : entry
              ),
            })),
          };
        }
      );
      // Additional invalidation for other queries
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};