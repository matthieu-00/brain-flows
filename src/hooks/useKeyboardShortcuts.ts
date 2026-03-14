import { useEffect } from 'react';
import { useLayoutStore } from '../store/layoutStore';
import { useDocumentStore } from '../store/documentStore';
import { useUIStore } from '../store/uiStore';
import { useAgentStore } from '../store/agentStore';
import {
  getResolvedShortcuts,
  parseCombo,
  eventMatchesCombo,
} from '../constants/keyboardShortcuts';
import type { ShortcutId } from '../types';

/** True if the event target is an input, textarea, contenteditable, or inside a modal. */
function isFocusInInputOrModal(): boolean {
  const el = document.activeElement;
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return true;
  if (el.isContentEditable) return true;
  const inDialog = el.closest('[role="dialog"]') ?? el.closest('[data-modal="true"]');
  return !!inDialog;
}

function dispatchShortcut(id: ShortcutId): void {
  switch (id) {
    case 'save':
      useDocumentStore.getState().saveDocument();
      break;
    case 'export':
      useDocumentStore.getState().exportDocument('pdf');
      break;
    case 'distractionFree':
      useLayoutStore.getState().toggleDistractionFreeMode();
      break;
    case 'agentChat':
      useAgentStore.getState().openAgentChat();
      break;
    case 'widgetAdd':
      useUIStore.getState().openWidgetModal('add');
      break;
    case 'widgetRemove':
      useUIStore.getState().openWidgetModal('remove');
      break;
    default:
      break;
  }
}

export const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const inInputOrModal = isFocusInInputOrModal();

      // Escape: close agent chat first, then exit distraction-free (not configurable)
      if (e.key === 'Escape') {
        const { isChatOpen, closeAgentChat } = useAgentStore.getState();
        if (isChatOpen) {
          e.preventDefault();
          closeAgentChat();
          return;
        }
        const { distractionFreeMode, toggleDistractionFreeMode } = useLayoutStore.getState();
        if (distractionFreeMode) {
          toggleDistractionFreeMode();
        }
        return;
      }

      if (inInputOrModal) return;

      const overrides = useLayoutStore.getState().settings.keyboardShortcuts;
      const resolved = getResolvedShortcuts(overrides);

      for (const [id, combo] of Object.entries(resolved) as [ShortcutId, string][]) {
        const parsed = parseCombo(combo);
        if (parsed && eventMatchesCombo(e, parsed)) {
          e.preventDefault();
          dispatchShortcut(id);
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};
