import React, { useState, useEffect, useCallback } from 'react';
import { useLayoutStore } from '../../store/layoutStore';
import { Button } from './Button';
import {
  getResolvedShortcuts,
  SHORTCUT_LABELS,
  formatComboFromEvent,
} from '../../constants/keyboardShortcuts';
import type { ShortcutId } from '../../types';

/** Display combo for UI: show "Ctrl" as "Ctrl" or "⌘" on Mac. */
function displayCombo(combo: string): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  if (!isMac) return combo;
  return combo.replace(/\bCtrl\b/g, '⌘');
}

export const KeyboardShortcutsSection: React.FC = () => {
  const { settings, updateSettings } = useLayoutStore();
  const overrides = settings.keyboardShortcuts ?? {};
  const resolved = getResolvedShortcuts(overrides);
  const [recordingId, setRecordingId] = useState<ShortcutId | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (recordingId === null) return;
      if (e.key === 'Escape') {
        setRecordingId(null);
        setConflictError(null);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const combo = formatComboFromEvent(e);
      const currentResolved = getResolvedShortcuts(overrides);
      const usedBy = (Object.entries(currentResolved) as [ShortcutId, string][]).find(
        ([id, c]) => id !== recordingId && c === combo
      );
      if (usedBy) {
        setConflictError(`Already used by "${SHORTCUT_LABELS[usedBy[0]]}"`);
        return;
      }
      setConflictError(null);
      updateSettings({
        keyboardShortcuts: { ...overrides, [recordingId]: combo },
      });
      setRecordingId(null);
    },
    [recordingId, overrides, updateSettings]
  );

  useEffect(() => {
    if (recordingId === null) return;
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [recordingId, handleKeyDown]);

  const handleResetToDefaults = () => {
    updateSettings({ keyboardShortcuts: {} });
    setRecordingId(null);
    setConflictError(null);
  };

  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-textMuted">
        View and customize keyboard shortcuts. Use Alt + key where possible to avoid browser menu conflicts.
      </p>
      {conflictError && (
        <p className="text-sm text-amber-700 dark:text-amber-400">{conflictError}</p>
      )}
      <div className="space-y-2">
        {(Object.keys(resolved) as ShortcutId[]).map((id) => (
          <div
            key={id}
            className="flex items-center justify-between gap-4 py-2 border-b border-neutral-200 dark:border-neutral-700 last:border-0"
          >
            <span className="text-sm text-neutral-900 dark:text-neutral-text">
              {SHORTCUT_LABELS[id]}
            </span>
            <div className="flex items-center gap-2">
              {recordingId === id ? (
                <span className="text-sm text-sage-600 dark:text-sage-400 animate-pulse">
                  Press key...
                </span>
              ) : (
                <>
                  <kbd className="px-2 py-1 text-xs font-mono bg-neutral-200 dark:bg-neutral-700 rounded border border-neutral-300 dark:border-neutral-600">
                    {displayCombo(resolved[id])}
                  </kbd>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRecordingId(id)}
                    className="text-xs"
                  >
                    Change
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {hasOverrides && (
        <Button variant="outline" size="sm" onClick={handleResetToDefaults}>
          Reset to defaults
        </Button>
      )}
    </div>
  );
};
