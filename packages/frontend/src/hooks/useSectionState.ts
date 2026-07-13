// frontend/src/hooks/useSectionState.ts

import { useState } from 'react';

export type SectionKey = 'active' | 'passive' | 'waiting' | 'paused' | 'knowledge';

export interface UseSectionStateOptions {
  initialExpanded?: Partial<Record<SectionKey, boolean>>;
}

export function useSectionState(options: UseSectionStateOptions = {}) {
  const { initialExpanded = {} } = options;

  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>(() => ({
    active: true,    // Standard: Active offen
    passive: false,
    waiting: false,
    paused: false,
    knowledge: false,
    ...initialExpanded,
  }));

  // Prüfen: Alle offen?
  const allExpanded = expanded.active && expanded.passive && expanded.waiting && expanded.paused && expanded.knowledge
    ? 'all'
    : expanded.active || expanded.passive || expanded.waiting || expanded.paused || expanded.knowledge
    ? 'some'
    : 'none';

  // Toggle: Eine Sektion öffnen, alle anderen schließen
  const toggleSection = (section: SectionKey) => {
    setExpanded((prev) => {
      const isCurrentlyExpanded = prev[section];
      
      if (isCurrentlyExpanded) {
        return { ...prev, [section]: false };
      }
      
      // Alle schließen, dann gewünschte öffnen
      const newState = {
        active: false,
        passive: false,
        waiting: false,
        paused: false,
        knowledge: false,
        [section]: true,
      };
      
      // 🔥 Nach dem Öffnen: Zum Sektions-Header scrollen
      setTimeout(() => {
        const element = document.getElementById(`section-${section}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      return newState;
    });
  };

  // Toggle All: Alle öffnen oder alle schließen
  const toggleAll = () => {
    if (allExpanded === 'all' || allExpanded === 'some') {
      setExpanded({
        active: false,
        passive: false,
        waiting: false,
        paused: false,
        knowledge: false,
      });
    } else {
      setExpanded({
        active: true,
        passive: true,
        waiting: true,
        paused: true,
        knowledge: true,
      });
    }
  };

  return {
    expanded,
    allExpanded,
    toggleSection,
    toggleAll,
    setExpanded,
  };
}