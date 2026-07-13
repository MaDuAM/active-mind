// ============================================
// FILE: frontend/src/hooks/useLoadingDebounce.ts
// PURPOSE: Prevents loading UI flicker by debouncing loading state
// DEPENDENCIES: react
// ============================================

import { useState, useEffect } from 'react';

// ============================================
// HOOK: useLoadingDebounce
// PURPOSE: Delays showing loading state to avoid brief flashes
// BEHAVIOR: Only returns true after isLoading has been true for `delay` ms
// USE CASE: Prevents loading spinner from appearing for fast operations (< 200ms)
// ============================================
export function useLoadingDebounce(isLoading: boolean, delay: number = 200) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (isLoading) {
      timer = setTimeout(() => setShow(true), delay);
    } else {
      setShow(false);
    }

    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  return show;
}