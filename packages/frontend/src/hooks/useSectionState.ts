// ============================================
// FILE: frontend/src/hooks/useSectionState.ts
// PURPOSE: Manages expansion state of dashboard sections with "accordion" behavior
// DEPENDENCIES: react
// ============================================

import { useState } from 'react';

// ============================================
// TYPES
// ============================================
export type SectionKey = 'active' | 'passive' | 'waiting' | 'paused' | 'knowledge';

export interface UseSectionStateOptions {
  initialExpanded?: Partial<Record<SectionKey, boolean>>;
}

// ============================================
// HOOK: useSectionState
// PURPOSE: Manages which sections are expanded/collapsed
// BEHAVIOR: Only one section can be expanded at a time (accordion)
// FEATURES:
//   - Toggle individual section (closes others)
//   - Auto-scroll to section header when opened
//   - allExpanded state for "expand all / collapse all"
// ============================================
export function useSectionState(options: UseSectionStateOptions = {}) {
  const { initialExpanded = {} } = options;

  // All sections default to collapsed except 'active' (true by default)
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>(() => ({
    active: true,    // Active section open by default
    passive: false,
    waiting: false,
    paused: false,
    knowledge: false,
    ...initialExpanded,
  }));

  // Determine overall expansion state
  const allExpanded = expanded.active && expanded.passive && expanded.waiting && expanded.paused && expanded.knowledge
    ? 'all'
    : expanded.active || expanded.passive || expanded.waiting || expanded.paused || expanded.knowledge
    ? 'some'
    : 'none';

  // Toggle a single section: close all others, open the selected one
  const toggleSection = (section: SectionKey) => {
    setExpanded((prev) => {
      const isCurrentlyExpanded = prev[section];
      
      if (isCurrentlyExpanded) {
        return { ...prev, [section]: false };
      }
      
      // Close all, open selected
      const newState = {
        active: false,
        passive: false,
        waiting: false,
        paused: false,
        knowledge: false,
        [section]: true,
      };
      
      // Auto-scroll to section header after opening
      setTimeout(() => {
        const element = document.getElementById(`section-${section}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      return newState;
    });
  };

  // Toggle all: expand all if collapsed, collapse all if any expanded
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