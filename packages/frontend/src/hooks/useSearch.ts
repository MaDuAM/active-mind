// ============================================
// FILE: frontend/src/hooks/useSearch.ts
// PURPOSE: Full-text search hook with debounced input and API integration
// DEPENDENCIES: react, tanstack/react-query, apiClient
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../lib/apiClient';
import { useQuery } from '@tanstack/react-query';

// ============================================
// API FUNCTION
// ============================================
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

// ============================================
// HOOK: useSearch
// PURPOSE: Debounced search with React Query caching
// PARAMETERS:
//   - entries: Full entry list (for reference, unused internally)
//   - searchTerm: Raw search input
//   - options.delay: Debounce delay in ms (default: 300)
//   - options.maxResults: Max results to return (default: 50)
// RETURNS: { results, isLoading }
// ============================================
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

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), delay);
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  // React Query with cache
  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedTerm],
    queryFn: () => searchEntries(debouncedTerm, 1, maxResults),
    enabled: debouncedTerm.trim().length > 0,
    staleTime: 30000,
  });

  // Memoize results
  const results = useMemo(() => {
    if (!data || !debouncedTerm.trim()) return [];
    return data.data.slice(0, maxResults);
  }, [data, debouncedTerm, maxResults]);

  return { results, isLoading };
}