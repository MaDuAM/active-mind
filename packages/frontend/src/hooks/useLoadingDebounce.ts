// hooks/useLoadingDebounce.ts
import { useState, useEffect } from 'react';

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