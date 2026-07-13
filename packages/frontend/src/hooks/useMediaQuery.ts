// ============================================
// FILE: frontend/src/hooks/useMediaQuery.ts
// PURPOSE: React hook for responsive design using CSS media queries
// DEPENDENCIES: react
// ============================================

import { useState, useEffect } from 'react';

// ============================================
// HOOK: useMediaQuery
// PURPOSE: Returns boolean indicating if media query matches
// BEHAVIOR: Updates on window resize and listens for changes
// USAGE: const isMobile = useMediaQuery('(max-width: 639px)')
// ============================================
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}