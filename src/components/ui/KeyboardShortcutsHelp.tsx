import React from 'react';

export const KeyboardShortcutsHelp: React.FC = () => (
  <div className="text-xs text-neutral-500 dark:text-neutral-textMuted text-center pt-2 border-t border-neutral-200 dark:border-neutral-700">
    <p>
      <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded">Alt + +</kbd> manage widgets (Add tab),{' '}
      <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded">Alt + -</kbd> manage widgets (Remove tab)
    </p>
  </div>
);
