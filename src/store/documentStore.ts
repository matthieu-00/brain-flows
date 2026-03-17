import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Document, ExportFormat } from '../types';
import { dateReplacer, dateReviver } from '../utils/persistDates';
import { exportToPdf } from '../utils/exportPdf';
import { htmlToMarkdown } from '../utils/exportMarkdown';
import { htmlToDocxBlob } from '../utils/exportDocx';
import { isSupabaseConfigured, requireSupabase } from '../lib/supabaseClient';
import { useAuthStore } from './authStore';

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
  isSyncing: boolean;
  hasLoadedCloudDocuments: boolean;
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
  loadDocumentsForUser: (userId: string) => Promise<void>;
  saveDocumentToServer: (document: Document) => Promise<void>;
  syncDocuments: () => Promise<void>;
}

interface DocumentRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  export_format: ExportFormat | null;
  word_count: number;
  character_count: number;
  created_at: string;
  updated_at: string;
}

const syncTimers = new Map<string, ReturnType<typeof setTimeout>>();
const SYNC_DEBOUNCE_MS = 900;

function toDocumentRow(document: Document, userId: string) {
  return {
    id: document.id,
    user_id: userId,
    title: document.title,
    content: document.content,
    export_format: document.exportFormat ?? null,
    word_count: document.wordCount,
    character_count: document.characterCount,
    created_at: document.createdAt.toISOString(),
    updated_at: document.updatedAt.toISOString(),
  };
}

function fromDocumentRow(row: DocumentRow): Document {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    exportFormat: row.export_format ?? undefined,
    wordCount: row.word_count,
    characterCount: row.character_count,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function queueDocumentSync(document: Document) {
  const userId = useAuthStore.getState().user?.id;
  if (!userId || !isSupabaseConfigured) return;

  const existing = syncTimers.get(document.id);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    void useDocumentStore.getState().saveDocumentToServer(document);
    syncTimers.delete(document.id);
  }, SYNC_DEBOUNCE_MS);

  syncTimers.set(document.id, timer);
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      currentDocument: null,
      documents: [],
      isAutoSaveEnabled: true,
      lastSaved: null,
      hasUnsavedChanges: false,
      isSyncing: false,
      hasLoadedCloudDocuments: false,
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
        const now = new Date();
        const newDoc: Document = {
          id: crypto.randomUUID(),
          title,
          content: '',
          createdAt: now,
          updatedAt: now,
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

        queueDocumentSync(newDoc);
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

        const nextDocument = get().documents.find((doc) => doc.id === id);
        if (nextDocument) queueDocumentSync(nextDocument);
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

        const pending = syncTimers.get(id);
        if (pending) {
          clearTimeout(pending);
          syncTimers.delete(id);
        }

        const userId = useAuthStore.getState().user?.id;
        if (userId && isSupabaseConfigured) {
          const supabase = requireSupabase();
          void supabase.from('documents').delete().eq('id', id).eq('user_id', userId);
        }
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
        const { currentDocument } = get();
        if (currentDocument) queueDocumentSync(currentDocument);
      },

      autoSave: () => {
        const { isAutoSaveEnabled, currentDocument } = get();
        if (isAutoSaveEnabled && currentDocument) {
          set({ lastSaved: new Date(), hasUnsavedChanges: false });
          queueDocumentSync(currentDocument);
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

      loadDocumentsForUser: async (userId: string) => {
        if (!isSupabaseConfigured) {
          set({ hasLoadedCloudDocuments: true });
          return;
        }

        const supabase = requireSupabase();
        set({ isSyncing: true, hasLoadedCloudDocuments: false });

        try {
          const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
          if (error) throw error;

          const rows = (data ?? []) as DocumentRow[];
          if (rows.length > 0) {
            const documents = rows.map(fromDocumentRow);
            set({
              documents,
              currentDocument: documents[0] ?? null,
              hasUnsavedChanges: false,
              isSyncing: false,
              hasLoadedCloudDocuments: true,
            });
            return;
          }

          // One-time migration path: if cloud is empty, upload existing local docs.
          const importedKey = `document-imported-${userId}`;
          const alreadyImported = localStorage.getItem(importedKey) === 'true';
          const localDocuments = get().documents;
          if (!alreadyImported && localDocuments.length > 0) {
            await get().syncDocuments();
            localStorage.setItem(importedKey, 'true');
          }

          set({ isSyncing: false, hasLoadedCloudDocuments: true });
        } catch {
          set({ isSyncing: false, hasLoadedCloudDocuments: true });
        }
      },

      saveDocumentToServer: async (document: Document) => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId || !isSupabaseConfigured) return;

        const supabase = requireSupabase();
        const payload = toDocumentRow(
          {
            ...document,
            updatedAt: new Date(),
          },
          userId
        );

        set({ isSyncing: true });
        try {
          const { error } = await supabase.from('documents').upsert(payload);
          if (error) throw error;
          set({ isSyncing: false, lastSaved: new Date(), hasUnsavedChanges: false });
        } catch {
          set({ isSyncing: false });
        }
      },

      syncDocuments: async () => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId || !isSupabaseConfigured) return;

        const { documents } = get();
        if (documents.length === 0) return;

        const supabase = requireSupabase();
        set({ isSyncing: true });

        try {
          const payload = documents.map((doc) => toDocumentRow(doc, userId));
          const { error } = await supabase.from('documents').upsert(payload);
          if (error) throw error;
          set({ isSyncing: false, lastSaved: new Date(), hasUnsavedChanges: false });
        } catch {
          set({ isSyncing: false });
        }
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