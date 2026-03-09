import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Document } from '../types';
import { dateReplacer, dateReviver } from '../utils/persistDates';

interface DocumentState {
  currentDocument: Document | null;
  documents: Document[];
  isAutoSaveEnabled: boolean;
  lastSaved: Date | null;
  createDocument: (title?: string) => Document;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  loadDocument: (id: string) => void;
  saveDocument: () => void;
  autoSave: () => void;
  exportDocument: (format: 'pdf' | 'docx' | 'txt') => void;
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      currentDocument: null,
      documents: [],
      isAutoSaveEnabled: true,
      lastSaved: null,

      createDocument: (title = 'Untitled Document') => {
        const newDoc: Document = {
          id: Date.now().toString(),
          title,
          content: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          wordCount: 0,
          characterCount: 0,
        };

        set(state => ({
          documents: [...state.documents, newDoc],
          currentDocument: newDoc,
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
        }));
      },

      deleteDocument: (id: string) => {
        set(state => ({
          documents: state.documents.filter(doc => doc.id !== id),
          currentDocument: state.currentDocument?.id === id 
            ? null 
            : state.currentDocument,
        }));
      },

      loadDocument: (id: string) => {
        const { documents } = get();
        const document = documents.find(doc => doc.id === id);
        if (document) {
          set({ currentDocument: document });
        }
      },

      saveDocument: () => {
        set({ lastSaved: new Date() });
        // Document is already persisted via Zustand persist middleware
      },

      autoSave: () => {
        const { isAutoSaveEnabled, currentDocument } = get();
        if (isAutoSaveEnabled && currentDocument) {
          set({ lastSaved: new Date() });
        }
      },

      exportDocument: (format: 'pdf' | 'docx' | 'txt') => {
        const { currentDocument } = get();
        if (!currentDocument) return;

        // Mock export functionality
        const blob = new Blob([currentDocument.content], { 
          type: format === 'txt' ? 'text/plain' : 'application/octet-stream' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentDocument.title}.${format}`;
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