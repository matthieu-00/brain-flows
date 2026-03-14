import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Document, ExportFormat } from '../types';
import { dateReplacer, dateReviver } from '../utils/persistDates';
import { exportToPdf } from '../utils/exportPdf';
import { htmlToMarkdown } from '../utils/exportMarkdown';
import { htmlToDocxBlob } from '../utils/exportDocx';

export interface DocumentSelection {
  from: number;
  to: number;
  text: string;
}

export type EditorReplacer = (from: number, to: number, replacement: string) => void;

interface DocumentState {
  currentDocument: Document | null;
  documents: Document[];
  isAutoSaveEnabled: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  /** Current editor selection (ProseMirror offsets); set by RichTextEditor */
  selection: DocumentSelection | null;
  /** Replacer function registered by the editor for applying suggestions */
  editorReplacer: EditorReplacer | null;
  createDocument: (title?: string, exportFormat?: ExportFormat) => Document;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  loadDocument: (id: string) => void;
  saveDocument: () => void;
  autoSave: () => void;
  exportDocument: (format: ExportFormat) => void;
  setSelection: (from: number, to: number, text: string) => void;
  clearSelection: () => void;
  setEditorReplacer: (replacer: EditorReplacer | null) => void;
  /** Apply a replacement in the editor at the given range. No-op if no editor registered. */
  replaceRange: (from: number, to: number, replacement: string) => void;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      currentDocument: null,
      documents: [],
      isAutoSaveEnabled: true,
      lastSaved: null,
      hasUnsavedChanges: false,
      selection: null,
      editorReplacer: null,

      setSelection: (from, to, text) =>
        set({ selection: { from, to, text } }),
      clearSelection: () => set({ selection: null }),
      setEditorReplacer: (replacer) => set({ editorReplacer: replacer }),
      replaceRange: (from, to, replacement) => {
        const { editorReplacer } = get();
        if (editorReplacer) editorReplacer(from, to, replacement);
      },

      createDocument: (title = 'Untitled Document', exportFormat?: ExportFormat) => {
        const newDoc: Document = {
          id: Date.now().toString(),
          title,
          content: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          wordCount: 0,
          characterCount: 0,
          ...(exportFormat && { exportFormat }),
        };

        set(state => ({
          documents: [...state.documents, newDoc],
          currentDocument: newDoc,
          hasUnsavedChanges: false,
          lastSaved: null,
        }));

        return newDoc;
      },

      updateDocument: (id: string, updates: Partial<Document>) => {
        const updatedDoc = {
          ...updates,
          updatedAt: new Date(),
        };

        set(state => ({
          documents: state.documents.map(doc => 
            doc.id === id ? { ...doc, ...updatedDoc } : doc
          ),
          currentDocument: state.currentDocument?.id === id 
            ? { ...state.currentDocument, ...updatedDoc }
            : state.currentDocument,
          hasUnsavedChanges: true,
        }));
      },

      deleteDocument: (id: string) => {
        const { documents, currentDocument } = get();
        const remaining = documents.filter(doc => doc.id !== id);
        const isDeletingCurrent = currentDocument?.id === id;
        const nextDoc = isDeletingCurrent && remaining.length > 0 ? remaining[0] : null;

        set(state => ({
          documents: remaining,
          currentDocument: isDeletingCurrent ? nextDoc : state.currentDocument,
        }));
      },

      loadDocument: (id: string) => {
        const { documents } = get();
        const document = documents.find(doc => doc.id === id);
        if (document) {
          set({ currentDocument: document, hasUnsavedChanges: false });
        }
      },

      saveDocument: () => {
        set({ lastSaved: new Date(), hasUnsavedChanges: false });
        // Document is already persisted via Zustand persist middleware
      },

      autoSave: () => {
        const { isAutoSaveEnabled, currentDocument } = get();
        if (isAutoSaveEnabled && currentDocument) {
          set({ lastSaved: new Date(), hasUnsavedChanges: false });
        }
      },

      exportDocument: (format: ExportFormat) => {
        const { currentDocument } = get();
        if (!currentDocument) return;

        const title = currentDocument.title || 'document';

        if (format === 'pdf') {
          exportToPdf(currentDocument.content, title);
          return;
        }

        if (format === 'docx') {
          htmlToDocxBlob(currentDocument.content, title).then((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${title}.docx`;
            link.click();
            URL.revokeObjectURL(url);
          });
          return;
        }

        // Markdown or plain text export
        const content =
          format === 'md'
            ? htmlToMarkdown(currentDocument.content)
            : new DOMParser().parseFromString(currentDocument.content, 'text/html').body.textContent ?? '';

        const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title}.${format}`;
        link.click();
        URL.revokeObjectURL(url);
      },
    }),
    {
      name: 'document-storage',
      storage: createJSONStorage(() => localStorage, {
        replacer: dateReplacer,
        reviver: dateReviver,
      }),
    }
  )
);