import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ChevronDown, FileText, Trash2 } from 'lucide-react';
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
    deleteDocument,
  } = useDocumentStore();

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      const target = e.target as Node;
      const inContainer = containerRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (isOpen && !inContainer && !inDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    } else {
      setDropdownPosition(null);
    }
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

  const handleDelete = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    const doc = documents.find((d) => d.id === docId);
    const title = doc?.title || 'Untitled Document';
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteDocument(docId);
    }
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

  const dropdownStyle = dropdownPosition
    ? {
        position: 'fixed' as const,
        top: dropdownPosition.top,
        right: dropdownPosition.right,
        width: 288,
        zIndex: 9999,
      }
    : undefined;

  return (
    <div className="relative" ref={containerRef}>
      <div ref={triggerRef} className="inline-flex">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen((prev) => !prev)}
          title="Switch document"
          aria-label="Switch document"
          aria-expanded={isOpen}
          className="px-2"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      {isOpen && dropdownStyle && createPortal(
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-72 bg-white dark:bg-neutral-surface rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 max-h-60 overflow-y-auto"
          style={dropdownStyle}
        >
          {sortedDocuments.map((doc) => {
            const isActive = doc.id === currentDocument?.id;
            return (
              <div
                key={doc.id}
                role="button"
                tabIndex={0}
                onClick={() => requestSwitch(doc.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    requestSwitch(doc.id);
                  }
                }}
                className={`w-full px-3 py-2 flex items-center justify-between gap-2 hover:bg-sage-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer ${
                  isActive ? 'bg-sage-100 dark:bg-neutral-800' : ''
                }`}
              >
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <FileText className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-text truncate">
                      {doc.title || 'Untitled Document'}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-textMuted">
                      Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, doc.id)}
                  className="p-1.5 rounded text-neutral-500 dark:text-neutral-textMuted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                  title="Delete document"
                  aria-label={`Delete "${doc.title || 'Untitled Document'}"`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
            </div>
          );
        })}
        </motion.div>,
        document.body
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
