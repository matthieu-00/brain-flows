import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { motion } from 'framer-motion';
import { MoreHorizontal, Bold, Italic, SeparatorHorizontal } from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';
import { PageBreak } from '../../extensions/PageBreak';
import { DocumentSwitcher } from './DocumentSwitcher';
import { useLayoutStore } from '../../store/layoutStore';

const editorFontOptions = [
  { label: 'Inter (Default)', value: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { label: 'System Sans', value: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
  { label: 'Georgia', value: 'Georgia, Times New Roman, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Monaco', value: 'Monaco, Menlo, Consolas, monospace' },
];

/** A4 page height in px at 96dpi (297mm) - used to decide when to show page break styling */
const PAGE_HEIGHT_PX = 1123;

interface RichTextEditorProps {
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ className }) => {
  const { currentDocument, updateDocument, autoSave } = useDocumentStore();
  const { settings, updateSettings } = useLayoutStore();
  const [showEditorOptions, setShowEditorOptions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const editorOptionsRef = useRef<HTMLDivElement>(null);
  const editorOptionsTriggerRef = useRef<HTMLButtonElement>(null);
  const editorOptionsDropdownRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isValidColor = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(settings.editorTextColor || '');
  const editorColor = isValidColor ? settings.editorTextColor : '#2c2c2c';
  const editorStyle = {
    '--editor-font-family': settings.editorFontFamily || 'Inter, ui-sans-serif, system-ui, sans-serif',
    '--editor-font-size': `${settings.editorFontSize || 18}px`,
    '--editor-text-color': editorColor,
  } as React.CSSProperties;

  const documentPagesRef = useRef<HTMLDivElement>(null);
  const visibilityRafRef = useRef<number | null>(null);

  const updatePageBreakVisibility = useCallback(() => {
    const container = documentPagesRef.current;
    const scrollParent = container?.closest('.overflow-y-auto');
    if (!container || !scrollParent) return;

    const pageBreaks = container.querySelectorAll('.page-break');
    const scrollTop = scrollParent.scrollTop;
    const containerRect = scrollParent.getBoundingClientRect();

    let prevBottom = 0;
    pageBreaks.forEach((pb) => {
      const pbRect = pb.getBoundingClientRect();
      const topInContent = pbRect.top - containerRect.top + scrollTop;
      const contentHeight = topInContent - prevBottom;
      const shouldShow = contentHeight >= PAGE_HEIGHT_PX;

      pb.classList.toggle('page-break-visible', shouldShow);
      prevBottom = topInContent + (pb as HTMLElement).offsetHeight;
    });
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      PageBreak,
      Placeholder.configure({
        placeholder: 'Start writing your thoughts...',
      }),
      CharacterCount.configure({
        limit: 100000,
      }),
    ],
    content: currentDocument?.content || '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      if (currentDocument) {
        const content = editor.getHTML();
        const text = editor.getText();
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        const characterCount = text.length;

        updateDocument(currentDocument.id, {
          content,
          wordCount,
          characterCount,
        });

        // Clear existing timeout
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }

        // Auto-save after 2 seconds of inactivity
        autoSaveTimeoutRef.current = setTimeout(() => {
          autoSave();
          autoSaveTimeoutRef.current = null;
        }, 2000);
      }

      // Update page break visibility after DOM has rendered
      if (visibilityRafRef.current) cancelAnimationFrame(visibilityRafRef.current);
      visibilityRafRef.current = requestAnimationFrame(() => {
        updatePageBreakVisibility();
        visibilityRafRef.current = null;
      });
    },
  });

  // Run visibility check when editor is ready and on resize
  useEffect(() => {
    if (!editor) return;
    updatePageBreakVisibility();
    const ro = new ResizeObserver(() => updatePageBreakVisibility());
    const container = documentPagesRef.current;
    if (container) ro.observe(container);
    return () => {
      ro.disconnect();
      if (visibilityRafRef.current) cancelAnimationFrame(visibilityRafRef.current);
    };
  }, [editor, updatePageBreakVisibility]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Position dropdown when opening (for portal)
  useEffect(() => {
    if (!showEditorOptions || !editorOptionsTriggerRef.current) {
      setDropdownPosition(null);
      return;
    }
    const rect = editorOptionsTriggerRef.current.getBoundingClientRect();
    const dropdownWidth = 256; // w-64
    setDropdownPosition({
      top: rect.bottom + 8,
      left: rect.right - dropdownWidth,
    });
  }, [showEditorOptions]);

  // Close editor options on click outside (trigger or dropdown)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!showEditorOptions) return;
      const target = e.target as Node;
      if (
        editorOptionsTriggerRef.current?.contains(target) ||
        editorOptionsDropdownRef.current?.contains(target)
      ) {
        return;
      }
      setShowEditorOptions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEditorOptions]);

  // Sync editor content only when switching documents (not on every edit)
  const lastDocIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!editor || !currentDocument) return;
    if (lastDocIdRef.current !== currentDocument.id) {
      editor.commands.setContent(currentDocument.content);
      lastDocIdRef.current = currentDocument.id;
      requestAnimationFrame(() => updatePageBreakVisibility());
    }
  }, [currentDocument, editor, updatePageBreakVisibility]);

  // Sync selection to store for agent document context; register replacer for applying suggestions
  useEffect(() => {
    if (!editor) return;
    const { setSelection, clearSelection, setEditorReplacer } = useDocumentStore.getState();
    const handler = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        clearSelection();
        return;
      }
      const text = editor.state.doc.textBetween(from, to, ' ');
      setSelection(from, to, text);
    };
    editor.on('selectionUpdate', handler);
    handler(); // initial sync
    setEditorReplacer((from, to, replacement) => {
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, replacement).run();
    });
    return () => {
      editor.off('selectionUpdate', handler);
      setEditorReplacer(null);
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-neutral-surface rounded-lg shadow-sm border border-neutral-300 dark:border-neutral-600 flex flex-col min-h-0 overflow-hidden ${className}`}
    >
      {/* Editor Toolbar */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-neutral-300 dark:border-neutral-600">
        <input
          type="text"
          value={currentDocument?.title ?? ''}
          onChange={(e) => {
            if (currentDocument) {
              updateDocument(currentDocument.id, { title: e.target.value });
            }
          }}
          className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-0 text-neutral-900 dark:text-neutral-text flex-1"
          placeholder="Untitled Document"
        />
        <DocumentSwitcher />
        <div className="relative" ref={editorOptionsRef}>
          <button
            ref={editorOptionsTriggerRef}
            type="button"
            onClick={() => setShowEditorOptions((prev) => !prev)}
            className="p-1.5 rounded text-neutral-500 dark:text-neutral-textMuted hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Editor options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showEditorOptions &&
            dropdownPosition &&
            createPortal(
              <motion.div
                ref={editorOptionsDropdownRef}
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                style={{
                  position: 'fixed',
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  zIndex: 9999,
                }}
                className="w-64 max-h-[min(70vh,28rem)] overflow-y-auto bg-white dark:bg-neutral-surface rounded-lg shadow-lg border border-gray-200 dark:border-neutral-700 py-2"
              >
                <div className="px-3 py-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleBold().run();
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      editor.isActive('bold')
                        ? 'bg-sage-200 dark:bg-sage-800 text-sage-900 dark:text-sage-100'
                        : 'text-neutral-600 dark:text-neutral-textMuted hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleItalic().run();
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      editor.isActive('italic')
                        ? 'bg-sage-200 dark:bg-sage-800 text-sage-900 dark:text-sage-100'
                        : 'text-neutral-600 dark:text-neutral-textMuted hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setPageBreak().run();
                    setShowEditorOptions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-neutral-900 dark:text-neutral-text hover:bg-sage-100 dark:hover:bg-neutral-700 flex items-center gap-2 transition-colors"
                >
                  <SeparatorHorizontal className="w-4 h-4" />
                  Insert page break
                </button>
                <div className="my-2 border-t border-neutral-200 dark:border-neutral-700" />
                <div className="px-3 py-1.5">
                  <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-textMuted mb-1.5">
                    Font
                  </label>
                  <select
                    value={settings.editorFontFamily || 'Inter, ui-sans-serif, system-ui, sans-serif'}
                    onChange={(e) => updateSettings({ editorFontFamily: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-text focus:ring-2 focus:ring-sage-500"
                  >
                    {editorFontOptions.map((opt) => (
                      <option key={opt.label} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="px-3 py-1.5">
                  <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-textMuted mb-1.5">
                    Text color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.editorTextColor || '#2c2c2c'}
                      onChange={(e) => updateSettings({ editorTextColor: e.target.value })}
                      className="h-8 w-10 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.editorTextColor || '#2c2c2c'}
                      onChange={(e) => updateSettings({ editorTextColor: e.target.value })}
                      className="flex-1 px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-text font-mono"
                    />
                  </div>
                </div>
              </motion.div>,
              document.body
            )}
        </div>
      </div>

      {/* Editor Content - single scroll container, content starts at top */}
      <div
        className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden cursor-text"
        onClick={() => editor.commands.focus()}
      >
        <div
          ref={documentPagesRef}
          className="document-pages w-full"
          style={editorStyle}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

    </motion.div>
  );
};