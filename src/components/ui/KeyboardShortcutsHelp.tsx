import React from 'react';

export const KeyboardShortcutsHelp: React.FC = () => (
  <div className="text-xs text-neutral-500 dark:text-neutral-textMuted text-center pt-2 border-t border-neutral-200 dark:border-neutral-700">
    <p>
      Keyboard shortcuts:{' '}
      <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded">Alt + +</kbd> to add widgets,{' '}
      <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded">Alt + -</kbd> to remove widgets
    </p>
  </div>
);
