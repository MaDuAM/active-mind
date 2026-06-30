// frontend/src/hooks/useApi.ts

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Entry, Topic, Tracking, CreateEntryPayload, Step } from '../types';
import { apiClient } from '../lib/apiClient';

// ============================================
// QUERY KEYS
// ============================================
export const queryKeys = {
  entry: (id: number) => ['entry', id] as const,
  topics: () => ['topics'] as const,
};

// ============================================
// API FETCH FUNCTIONS
// ============================================
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

  getEntry: async (id: number) => {
    return apiClient.get<Entry & { trackings: Tracking[] }>(`/entries/${id}`);
  },

  getTopics: async () => {
    return apiClient.get<Topic[]>('/topics');
  },

  createEntry: async (data: CreateEntryPayload) => {
    return apiClient.post<Entry>('/entries', data);
  },

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

  deleteEntry: async (id: number) => {
    return apiClient.delete<{ ok: true }>(`/entries/${id}`);
  },

  restoreEntry: async (id: number) => {
    return apiClient.post<{ ok: true }>(`/entries/${id}/restore`);
  },

  permanentDeleteEntry: async (id: number) => {
    return apiClient.delete<{ ok: true }>(`/entries/${id}/permanent`);
  },

  changeStatus: async ({ id, newStatus, note }: { id: number; newStatus: string; note?: string }) => {
    return apiClient.post<{ ok: true }>(`/entries/${id}/status`, { newStatus, note });
  },

  changeStep: async ({ id, newStepIndex, note }: { id: number; newStepIndex: number; note?: string }) => {
    return apiClient.post<{ ok: true }>(`/entries/${id}/step`, { newStepIndex, note });
  },

  addManualTracking: async ({ id, timestamp, note }: { id: number; timestamp: string; note?: string }) => {
    return apiClient.post<{ ok: true }>(`/entries/${id}/tracking/manual`, { timestamp, note });
  },

  createTopic: async (name: string) => {
    return apiClient.post<Topic>('/topics', { name });
  },

  deleteTopic: async (id: number) => {
    return apiClient.delete<{ ok: true }>(`/topics/${id}`);
  },
};

// ============================================
// QUERY HOOKS
// ============================================

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

export const useEntry = (id: number) => {
  return useQuery({
    queryKey: queryKeys.entry(id),
    queryFn: () => api.getEntry(id),
    enabled: !!id,
  });
};

export const useTopics = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.topics(),
    queryFn: api.getTopics,
    staleTime: 300000,
    enabled,
  });
};

// ============================================
// MUTATION HOOKS
// ============================================

export const useStatusChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.changeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

export const useStepChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.changeStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

export const useDeleteEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

export const useRestoreEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.restoreEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

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

export const useCreateEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

export const usePermanentDeleteEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.permanentDeleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

export const useManualTracking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.addManualTracking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries-paginated'] });
    },
  });
};

export const useCreateTopic = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.topics() });
    },
  });
};

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