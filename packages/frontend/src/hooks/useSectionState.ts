// frontend/src/hooks/useSectionState.ts

import { useState, useEffect, useRef, useMemo } from 'react';

export type SectionKey = 'active' | 'passive' | 'waiting' | 'paused' | 'knowledge';

export interface UseSectionStateOptions {
  autoExpand?: boolean;
  initialExpanded?: Partial<Record<SectionKey, boolean>>;
  getSectionHasItems?: () => Record<SectionKey, boolean>;
}

export function useSectionState(options: UseSectionStateOptions = {}) {
  const {
    autoExpand = true,
    initialExpanded = {},
    getSectionHasItems,
  } = options;

  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>(() => ({
    active: false,
    passive: false,
    waiting: false,
    paused: false,
    knowledge: false,
    ...initialExpanded,
  }));

  const hasAutoExpanded = useRef(false);

  // ============================================
  // Computed: Check if all sections are expanded
  // ============================================
  const allExpanded = useMemo(() => {
    const all = expanded.active && expanded.passive && expanded.waiting && expanded.paused && expanded.knowledge;
    return all ? 'all' : 'none';
  }, [expanded]);

  const toggleSection = (section: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleAll = () => {
    if (allExpanded === 'all') {
      setExpanded({
        active: false,
        passive: false,
        waiting: false,
        paused: false,
        knowledge: false,
      });
    } else {
      const sectionHasItems = getSectionHasItems?.() ?? {
        active: false,
        passive: false,
        waiting: false,
        paused: false,
        knowledge: false,
      };
      setExpanded({
        active: sectionHasItems.active,
        passive: sectionHasItems.passive,
        waiting: sectionHasItems.waiting,
        paused: sectionHasItems.paused,
        knowledge: sectionHasItems.knowledge,
      });
    }
  };

  // ============================================
  // Auto-Expand: Only runs once on first mount
  // Prevents overriding manual user toggles
  // ============================================
  useEffect(() => {
    if (!autoExpand || !getSectionHasItems || hasAutoExpanded.current) return;

    const sectionHasItems = getSectionHasItems();
    const anyItems = Object.values(sectionHasItems).some(Boolean);

    if (anyItems) {
      setExpanded({
        active: sectionHasItems.active,
        passive: sectionHasItems.passive,
        waiting: sectionHasItems.waiting,
        paused: sectionHasItems.paused,
        knowledge: sectionHasItems.knowledge,
      });
      hasAutoExpanded.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExpand, getSectionHasItems]);

  return {
    expanded,
    allExpanded,
    toggleSection,
    toggleAll,
    setExpanded,
  };
}