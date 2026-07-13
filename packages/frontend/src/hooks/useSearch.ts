// frontend/src/hooks/useSearch.ts

import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../lib/apiClient';
import { useQuery } from '@tanstack/react-query';

const searchEntries = async (query: string, page: number = 1, limit: number = 50) => {
  if (!query.trim()) return { data: [], pagination: { total: 0, totalPages: 0 } };
  
  const response = await apiClient.get<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>('/search', { q: query.trim(), page, limit });
  
  return response;
};

export function useSearch(
  _entries: any[],
  searchTerm: string,
  options: {
    delay?: number;
    maxResults?: number;
  } = {}
) {
  const { delay = 300, maxResults = 50 } = options;
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), delay);
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  // 🔥 isLoading aus useQuery holen
  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedTerm],
    queryFn: () => searchEntries(debouncedTerm, 1, maxResults),
    enabled: debouncedTerm.trim().length > 0,
    staleTime: 30000,
  });

  const results = useMemo(() => {
    if (!data || !debouncedTerm.trim()) return [];
    return data.data.slice(0, maxResults);
  }, [data, debouncedTerm, maxResults]);

  // 🔥 isLoading mit zurückgeben
  return { results, isLoading };
}