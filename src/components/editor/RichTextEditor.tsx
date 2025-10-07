import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { motion } from 'framer-motion';
import { useDocumentStore } from '../../store/documentStore';

interface RichTextEditorProps {
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ className }) => {
  const { currentDocument, updateDocument, autoSave } = useDocumentStore();

  const editor = useEditor({
    extensions: [
      StarterKit,
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
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[60vh] px-8 py-6',
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

        // Auto-save after 2 seconds of inactivity
        const timeoutId = setTimeout(() => {
          autoSave();
        }, 2000);

        return () => clearTimeout(timeoutId);
      }
    },
  });

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
      className={`bg-white rounded-lg shadow-sm border border-neutral-300 ${className}`}
    >
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-300">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={currentDocument?.title || 'Untitled Document'}
            onChange={(e) => {
              if (currentDocument) {
                updateDocument(currentDocument.id, { title: e.target.value });
              }
            }}
            className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-0 text-neutral-900"
            placeholder="Document title..."
          />
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-neutral-600">
          <span>{currentDocument?.wordCount || 0} words</span>
          <span>{currentDocument?.characterCount || 0} characters</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-sage-700 rounded-full"></div>
            <span>Auto-saved</span>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="min-h-[60vh] max-h-[80vh] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Editor Footer */}
      <div className="px-6 py-3 border-t border-neutral-300 bg-cream-100">
        <div className="flex items-center justify-between text-xs text-neutral-600">
          <span>
            Last updated: {currentDocument?.updatedAt ? 
              new Date(currentDocument.updatedAt).toLocaleString() : 
              'Never'
            }
          </span>
          <span>
            {editor.storage.characterCount.characters()}/{editor.extensionManager.extensions.find(ext => ext.name === 'characterCount')?.options.limit} characters
          </span>
        </div>
      </div>
    </motion.div>
  );
};