import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Save, Download, FilePlus, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface NewDocumentPromptProps {
  isOpen: boolean;
  onSaveAndNew: () => void;
  onExportAndNew: () => void;
  onDiscardAndNew: () => void;
  onCancel: () => void;
}

export const NewDocumentPrompt: React.FC<NewDocumentPromptProps> = ({
  isOpen,
  onSaveAndNew,
  onExportAndNew,
  onDiscardAndNew,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-neutral-900 bg-opacity-40"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
          >
            {/* Close */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon + heading */}
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-sage-100">
                <FilePlus className="w-5 h-5 text-sage-900" />
              </div>
              <h2 className="text-base font-semibold text-neutral-900">
                Start a new document?
              </h2>
            </div>

            <p className="text-sm text-neutral-600 mb-6">
              You have unsaved changes. What would you like to do before starting fresh?
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={onSaveAndNew}
                className="w-full justify-start gap-2"
              >
                <Save className="w-4 h-4" />
                Save &amp; start new
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onExportAndNew}
                className="w-full justify-start gap-2"
              >
                <Download className="w-4 h-4" />
                Export as PDF &amp; start new
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onDiscardAndNew}
                className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <FilePlus className="w-4 h-4" />
                Discard &amp; start new
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
