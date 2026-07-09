// frontend/src/hooks/useApi.ts

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Entry, Topic, Tracking, CreateEntryPayload, Step } from '../types';
import { apiClient } from '../lib/apiClient';

// ============================================
// QUERY KEYS
// Centralized cache keys for React Query
// Enables consistent invalidation across hooks
// ============================================
export const queryKeys = {
  entry: (id: number) => ['entry', id] as const,
  topics: () => ['topics'] as const,
};

// ============================================
// API FETCH FUNCTIONS
// Thin wrappers around apiClient with typed responses
// Each function maps directly to a backend endpoint
// ============================================

/**
 * Fetch paginated entries with optional filters
 * @param filters - Topic ID, area, status, deleted-only, pagination params
 * @returns Paginated response with entries and metadata
 */
const api = {
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

  /**
   * Fetch a single entry by ID with its tracking history
   */
  getEntry: async (id: number) => {
    return apiClient.get<Entry & { trackings: Tracking[] }>(`/entries/${id}`);
  },

  /**
   * Fetch all topics for the current user
   */
  getTopics: async () => {
    return apiClient.get<Topic[]>('/topics');
  },

  /**
   * Create a new entry
   * @param data - Entry data including area, topic, essence, etc.
   */
  createEntry: async (data: CreateEntryPayload) => {
    return apiClient.post<Entry>('/entries', data);
  },

  /**
   * Update an existing entry
   * @param data - Entry ID + fields to update + optional change note
   */
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

  /**
   * Soft-delete an entry (moves to trash)
   */
  deleteEntry: async (id: number) => {
    return apiClient.delete<{ ok: true }>(`/entries/${id}`);
  },

  /**
   * Restore an entry from trash
   */
  restoreEntry: async (id: number) => {
    return apiClient.post<{ ok: true }>(`/entries/${id}/restore`);
  },

  /**
   * Permanently delete an entry (cannot be undone)
   */
  permanentDeleteEntry: async (id: number) => {
    return apiClient.delete<{ ok: true }>(`/entries/${id}/permanent`);
  },

  /**
   * Change entry status (WAITING ↔ ACTIVE ↔ PAUSED)
   * Triggers a STATUS_CHANGE tracking entry
   */
  changeStatus: async ({ id, newStatus, note }: { id: number; newStatus: string; note?: string }) => {
    return apiClient.post<{ ok: true }>(`/entries/${id}/status`, { newStatus, note });
  },

  /**
   * Change current step index for ACTIVE entries
   * Triggers a STEP_CHANGE tracking entry
   */
  changeStep: async ({ id, newStepIndex, note }: { id: number; newStepIndex: number; note?: string }) => {
    return apiClient.post<{ ok: true }>(`/entries/${id}/step`, { newStepIndex, note });
  },

  /**
   * Add a manual tracking entry with custom timestamp
   * Used for backdating progress or offline work
   */
  addManualTracking: async ({ id, timestamp, note }: { id: number; timestamp: string; note?: string }) => {
    return apiClient.post<{ ok: true }>(`/entries/${id}/tracking/manual`, { timestamp, note });
  },

  /**
   * Create a new topic
   */
  createTopic: async (name: string) => {
    return apiClient.post<Topic>('/topics', { name });
  },

  /**
   * Delete a topic (only allowed when no entries remain)
   */
  deleteTopic: async (id: number) => {
    return apiClient.delete<{ ok: true }>(`/topics/${id}`);
  },

  toggleFavorite: async (id: number) => {
    return apiClient.patch<{ id: number; isFavorite: boolean }>(`/entries/${id}/favorite`);
  },
};

// ============================================
// QUERY HOOKS
// React Query hooks for data fetching
// ============================================

/**
 * Infinite query for paginated entries with scroll-based loading
 * @param filters - Filters and pagination options
 * @param enabled - Whether the query should run
 * @returns Infinite query result with fetchNextPage, hasNextPage, etc.
 */
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
  const limit = filters?.limit || 50;

  return useInfiniteQuery({
    queryKey: ['entries-paginated', { ...filters, limit }],
    queryFn: ({ pageParam = 1 }) =>
      api.getEntries({
        ...filters,
        page: pageParam,
        limit,
      }),
    /**
     * Determines the next page from the last response
     * Returns undefined when no more pages exist
     */
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

/**
 * Fetch a single entry by ID with its trackings
 * @param id - Entry ID
 * @returns Query result containing entry + trackings
 */
export const useEntry = (id: number) => {
  return useQuery({
    queryKey: queryKeys.entry(id),
    queryFn: () => api.getEntry(id),
    enabled: !!id,
  });
};

/**
 * Fetch all topics for the current user
 * @param enabled - Whether the query should run
 * @returns Query result with topics array
 */
export const useTopics = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.topics(),
    queryFn: api.getTopics,
    staleTime: 300000, // 5 minutes - topics rarely change
    enabled,
  });
};

// ============================================
// MUTATION HOOKS
// React Query mutations for data modifications
// Each hook invalidates relevant queries on success
// ============================================

/**
 * Change entry status (WAITING/ACTIVE/PAUSED)
 * Invalidates entry list cache on success
 */
export const useStatusChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.changeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

/**
 * Change current step index for ACTIVE entries
 * Invalidates entry list cache on success
 */
export const useStepChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.changeStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

/**
 * Soft-delete entry (moves to trash)
 * Invalidates entry list cache on success
 */
export const useDeleteEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

/**
 * Restore entry from trash
 * Invalidates entry list cache on success
 */
export const useRestoreEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.restoreEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

/**
 * Update entry fields (essence, actionName, steps, etc.)
 * Invalidates both list and single entry cache on success
 */
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

/**
 * Create a new entry
 * Invalidates entry list cache on success
 */
export const useCreateEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

/**
 * Permanently delete entry (cannot be undone)
 * Invalidates entry list cache on success
 */
export const usePermanentDeleteEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.permanentDeleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

/**
 * Add manual tracking entry with custom timestamp
 * Invalidates entry list cache on success
 */
export const useManualTracking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.addManualTracking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

/**
 * Create a new topic
 * Invalidates topics cache on success
 */
export const useCreateTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.topics() });
    },
  });
};

/**
 * Delete a topic (only when empty)
 * Invalidates topics and entry list caches on success
 */
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

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.toggleFavorite,
    onSuccess: (data) => {
      // Manuell den Cache updaten
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
      // Zusätzlich invalidieren für andere Queries
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};