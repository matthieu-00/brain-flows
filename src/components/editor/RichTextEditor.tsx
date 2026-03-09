import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';
import { PageBreak } from '../../extensions/PageBreak';

interface RichTextEditorProps {
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ className }) => {
  const { currentDocument, updateDocument, autoSave } = useDocumentStore();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        class: 'prose prose-lg max-w-none focus:outline-none caret-neutral-900',
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
    },
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Update editor content when document changes
  useEffect(() => {
    if (editor && currentDocument && editor.getHTML() !== currentDocument.content) {
      editor.commands.setContent(currentDocument.content);
    }
  }, [currentDocument, editor]);

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
      className={`bg-white rounded-lg shadow-sm border border-neutral-300 flex flex-col min-h-0 overflow-hidden ${className}`}
    >
      {/* Editor Toolbar */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-neutral-300">
        <input
          type="text"
          value={currentDocument?.title || 'Untitled Document'}
          onChange={(e) => {
            if (currentDocument) {
              updateDocument(currentDocument.id, { title: e.target.value });
            }
          }}
          className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-0 text-neutral-900 flex-1"
          placeholder="Document title..."
        />
        <button
          type="button"
          onClick={() => editor.chain().focus().setPageBreak().run()}
          className="p-1.5 rounded text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          title="Insert page break"
        >
          <FileText className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 min-h-0 overflow-y-auto cursor-text">
        <div className="document-pages">
          <EditorContent editor={editor} />
        </div>
      </div>

    </motion.div>
  );
};