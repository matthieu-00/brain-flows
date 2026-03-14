import type { ShortcutId } from '../types';

/** Default keybindings. Prefer Alt for app-specific actions where possible. */
export const DEFAULT_KEYBOARD_SHORTCUTS: Record<ShortcutId, string> = {
  save: 'Ctrl+S',
  export: 'Ctrl+E',
  distractionFree: 'Ctrl+Shift+Enter',
  agentChat: 'Ctrl+J',
  widgetAdd: 'Alt++',
  widgetRemove: 'Alt+-',
};

/** Modifier order for consistent formatting: Ctrl, Alt, Shift, Meta, then key. */
const MODIFIER_ORDER = ['Ctrl', 'Alt', 'Shift', 'Meta'] as const;

export interface ParsedCombo {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

/**
 * Parse a normalized combo string (e.g. "Ctrl+S", "Alt++") into a structured form.
 * "Ctrl" is used for both Ctrl and Cmd (metaKey) in the string; we treat Meta as Cmd on Mac.
 */
export function parseCombo(combo: string): ParsedCombo | null {
  const parts = combo.trim().split('+').map((p) => p.trim());
  if (parts.length === 0) return null;
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);
  const ctrlKey = modifiers.includes('Ctrl');
  const altKey = modifiers.includes('Alt');
  const shiftKey = modifiers.includes('Shift');
  const metaKey = modifiers.includes('Meta');
  return { key, ctrlKey, altKey, shiftKey, metaKey };
}

/**
 * Build a normalized combo string from a KeyboardEvent.
 * Uses "Ctrl" for both ctrlKey and metaKey (Cmd) so one combo works on Mac/Windows.
 */
export function formatComboFromEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  const key = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key;
  parts.push(key);
  return parts.join('+');
}

/**
 * Get the full shortcut map: user overrides merged over defaults.
 */
export function getResolvedShortcuts(
  overrides?: Partial<Record<ShortcutId, string>>
): Record<ShortcutId, string> {
  return { ...DEFAULT_KEYBOARD_SHORTCUTS, ...overrides };
}

/**
 * Check if a KeyboardEvent matches a parsed combo.
 * Treats Ctrl and Meta (Cmd) as equivalent so "Ctrl+S" matches both Ctrl+S and Cmd+S.
 */
export function eventMatchesCombo(e: KeyboardEvent, parsed: ParsedCombo): boolean {
  const keyMatch =
    parsed.key === 'Space'
      ? e.key === ' '
      : parsed.key.length === 1
        ? e.key.toLowerCase() === parsed.key.toLowerCase()
        : e.key === parsed.key;
  if (!keyMatch) return false;
  const ctrlOrMeta = e.ctrlKey || e.metaKey;
  if (parsed.ctrlKey || parsed.metaKey) {
    if (!ctrlOrMeta) return false;
  } else {
    if (ctrlOrMeta) return false;
  }
  if (parsed.altKey !== e.altKey) return false;
  if (parsed.shiftKey !== e.shiftKey) return false;
  return true;
}

/** Human-readable labels for each shortcut action. */
export const SHORTCUT_LABELS: Record<ShortcutId, string> = {
  save: 'Save document',
  export: 'Export document (PDF)',
  distractionFree: 'Toggle focus mode',
  agentChat: 'Open AI agent chat',
  widgetAdd: 'Add widget',
  widgetRemove: 'Remove widget',
};
