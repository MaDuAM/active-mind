// ============================================
// FILE: frontend/src/hooks/index.ts
// PURPOSE: Central export barrel for all custom hooks
// DEPENDENCIES: All hook implementations
// ============================================

// ============================================
// API HOOKS
// ============================================
export {
  usePaginatedEntries,
  useEntry,
  useTopics,
  useEntriesBySection,
  useCreateEntry,
  useUpdateEntry,
  useDeleteEntry,
  useRestoreEntry,
  usePermanentDeleteEntry,
  useStatusChange,
  useStepChange,
  useManualTracking,
  useCreateTopic,
  useDeleteTopic,
  useToggleFavorite,
  queryKeys,
} from './useApi';

// ============================================
// SEARCH HOOK
// ============================================
export { useSearch } from './useSearch';