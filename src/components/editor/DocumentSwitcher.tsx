import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDocumentStore } from '../../store/documentStore';
import { Button } from '../ui/Button';
import { UnsavedChangesPrompt } from './UnsavedChangesPrompt';

export const DocumentSwitcher: React.FC = () => {
  const {
    documents,
    currentDocument,
    hasUnsavedChanges,
    saveDocument,
    exportDocument,
    loadDocument,
  } = useDocumentStore();

  const [isOpen, setIsOpen] = useState(false);
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sortedDocuments = useMemo(
    () =>
      [...documents].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [documents]
  );

  const pendingDocument = pendingDocumentId
    ? documents.find((doc) => doc.id === pendingDocumentId) ?? null
    : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const hasCurrentContent =
    !!currentDocument &&
    (currentDocument.content.replace(/<[^>]*>/g, '').trim().length > 0 ||
      currentDocument.title !== 'Untitled Document');

  const requestSwitch = (targetDocumentId: string) => {
    if (targetDocumentId === currentDocument?.id) {
      setIsOpen(false);
      return;
    }

    if (hasUnsavedChanges && hasCurrentContent) {
      setPendingDocumentId(targetDocumentId);
      setShowUnsavedPrompt(true);
      setIsOpen(false);
      return;
    }

    loadDocument(targetDocumentId);
    setIsOpen(false);
  };

  const continueSwitch = (mode: 'save' | 'export' | 'discard') => {
    if (!pendingDocumentId) return;

    if (mode === 'save') {
      saveDocument();
    } else if (mode === 'export') {
      exportDocument('pdf');
    }

    loadDocument(pendingDocumentId);
    setPendingDocumentId(null);
    setShowUnsavedPrompt(false);
  };

  if (documents.length <= 1) {
    return null;
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Switch document"
        className="px-2"
      >
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-60 overflow-y-auto"
        >
          {sortedDocuments.map((doc) => {
            const isActive = doc.id === currentDocument?.id;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => requestSwitch(doc.id)}
                className={`w-full px-3 py-2 text-left hover:bg-sage-100 transition-colors ${
                  isActive ? 'bg-sage-100' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {doc.title || 'Untitled Document'}
                    </p>
                    <p className="text-xs text-neutral-600">
                      Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </motion.div>
      )}

      <UnsavedChangesPrompt
        isOpen={showUnsavedPrompt}
        title={`Switch to "${pendingDocument?.title || 'Untitled Document'}"?`}
        description="You have unsaved changes in the current document. What would you like to do before switching?"
        continueLabel="switch"
        onSaveAndContinue={() => continueSwitch('save')}
        onExportAndContinue={() => continueSwitch('export')}
        onDiscardAndContinue={() => continueSwitch('discard')}
        onCancel={() => {
          setPendingDocumentId(null);
          setShowUnsavedPrompt(false);
        }}
      />
    </div>
  );
};
