// ============================================
// FILE: frontend/src/components/ScrollToTop.tsx
// PURPOSE: Floating button that scrolls the main content area to top
// DEPENDENCIES: react, useMediaQuery
// ============================================

import { useState, useEffect } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';

// ============================================
// COMPONENT: ScrollToTop
// ============================================
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const isMobile = useMediaQuery('(max-width: 639px)');

  // ============================================
  // SCROLL LISTENER
  // PURPOSE: Shows/hides button based on scroll position
  // ============================================
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    const handleScroll = () => {
      setVisible(main.scrollTop > 300);
    };

    main.addEventListener('scroll', handleScroll);
    return () => main.removeEventListener('scroll', handleScroll);
  }, []);

  // ============================================
  // SCROLL HANDLER
  // PURPOSE: Smooth scrolls main content to top
  // ============================================
  const scrollToTop = () => {
    const main = document.querySelector('main');
    if (main) {
      main.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!visible) return null;

  // ============================================
  // RENDER
  // ============================================
  return (
    <button
      onClick={scrollToTop}
      className={`fixed right-4 z-50 w-10 h-10 rounded-full bg-gold-500 text-white shadow-lg hover:bg-gold-600 hover:scale-105 transition-all duration-200 flex items-center justify-center text-2xl ${
        isMobile ? 'bottom-[76px]' : 'bottom-4'
      }`}
      aria-label="Scroll to top"
    >
      ↑
    </button>
  );
}