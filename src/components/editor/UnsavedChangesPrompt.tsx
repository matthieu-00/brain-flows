import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Save, Download, FilePlus, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface UnsavedChangesPromptProps {
  isOpen: boolean;
  title: string;
  description: string;
  continueLabel?: string;
  onSaveAndContinue: () => void;
  onExportAndContinue: () => void;
  onDiscardAndContinue: () => void;
  onCancel: () => void;
}

export const UnsavedChangesPrompt: React.FC<UnsavedChangesPromptProps> = ({
  isOpen,
  title,
  description,
  continueLabel = 'continue',
  onSaveAndContinue,
  onExportAndContinue,
  onDiscardAndContinue,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-neutral-900 bg-opacity-40"
            onClick={onCancel}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 w-full max-w-sm bg-white dark:bg-neutral-surface rounded-2xl shadow-xl p-6"
          >
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1 rounded text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-sage-100 dark:bg-sage-400/20">
                <FilePlus className="w-5 h-5 text-sage-900" />
              </div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-text">{title}</h2>
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-textMuted mb-6">{description}</p>

            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={onSaveAndContinue}
                className="w-full justify-start gap-2"
              >
                <Save className="w-4 h-4" />
                Save &amp; {continueLabel}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onExportAndContinue}
                className="w-full justify-start gap-2"
              >
                <Download className="w-4 h-4" />
                Export as PDF &amp; {continueLabel}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onDiscardAndContinue}
                className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <FilePlus className="w-4 h-4" />
                Discard &amp; {continueLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
