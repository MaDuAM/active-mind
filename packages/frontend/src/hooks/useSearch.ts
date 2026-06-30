// frontend/src/hooks/useSearch.ts

import { useMemo, useState, useEffect } from 'react';
import { Entry } from '../types';

interface UseSearchOptions {
  delay?: number;
  maxResults?: number;
  searchFields?: (keyof Pick<Entry, 'essenceText' | 'essenceShort' | 'actionName' | 'benefit' | 'pauseReason'>)[];
}

export function useSearch(
  entries: Entry[],
  searchTerm: string,
  options: UseSearchOptions = {}
) {
  const {
    delay = 300,
    maxResults = 50,
    searchFields = ['essenceText', 'essenceShort', 'actionName', 'benefit', 'pauseReason'],
  } = options;

  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), delay);
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  // ============================================
  // SUCHE: Gefilterte Einträge
  // ============================================
  const filteredEntries = useMemo(() => {
    const term = debouncedTerm.trim().toLowerCase();
    if (!term) return [];

    const results: Entry[] = [];

    for (const entry of entries) {
      if (results.length >= maxResults) break;

      const match = searchFields.some((field) => {
        const value = entry[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(term);
        }
        return false;
      });

      const stepsMatch = entry.steps?.some((step) =>
        step.description.toLowerCase().includes(term)
      );

      if (match || stepsMatch) {
        results.push(entry);
      }
    }

    return results;
  }, [entries, debouncedTerm, maxResults, searchFields]);

  return filteredEntries;
}