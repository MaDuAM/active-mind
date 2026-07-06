// hooks/useSectionState.ts

import { useState, useEffect } from 'react';

export type SectionKey = 'active' | 'passive' | 'waiting' | 'paused' | 'knowledge';

export interface UseSectionStateOptions {
  /** Auto-expand sections that have entries */
  autoExpand?: boolean;
  /** Initial expanded state (default: all false) */
  initialExpanded?: Partial<Record<SectionKey, boolean>>;
  /** Dependency array to trigger auto-expand recalculation */
  deps?: any[];
  /** Function that returns which sections have entries */
  getSectionHasItems?: () => Record<SectionKey, boolean>;
}

export function useSectionState(options: UseSectionStateOptions = {}) {
  const {
    autoExpand = true,
    initialExpanded = {},
    deps = [],
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

  const [allExpanded, setAllExpanded] = useState<'all' | 'none'>('none');

  const toggleSection = (section: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
    setAllExpanded('none');
  };

  const toggleAll = () => {
    if (allExpanded === 'none') {
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
      setAllExpanded('all');
    } else {
      setExpanded({
        active: false,
        passive: false,
        waiting: false,
        paused: false,
        knowledge: false,
      });
      setAllExpanded('none');
    }
  };

  // Auto-expand sections that have entries
  useEffect(() => {
    if (!autoExpand || !getSectionHasItems) return;

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExpand, getSectionHasItems, ...deps]);

  return {
    expanded,
    allExpanded,
    toggleSection,
    toggleAll,
    setExpanded,
  };
}