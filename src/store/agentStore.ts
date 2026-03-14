import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { dateReplacer, dateReviver } from '../utils/persistDates';

export type AgentConnectionStatus = 'disconnected' | 'connected' | 'error';

export type AgentPanelSide = 'left' | 'right';

export interface AgentRunResult {
  id: string;
  type: 'suggestion' | 'citation' | 'spellcheck' | 'research' | 'message';
  summary: string;
  status: 'pending' | 'ready' | 'applied' | 'dismissed';
  createdAt: string; // ISO
  payload?: unknown;
  /** Thread this run belongs to */
  threadId?: string;
}

export interface AgentChatAttachment {
  id: string;
  name: string;
  mimeType?: string;
  /** Base64-encoded content for persistence */
  content: string;
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: AgentChatAttachment[];
}

export interface AgentThread {
  id: string;
  name: string | null; // user or agent can set
  runIds: string[];
  messages: AgentChatMessage[];
  createdAt: string; // ISO
  /** Document IDs to include as context in addition to current document */
  contextDocumentIds?: string[];
}

export interface PendingSuggestion {
  id: string;
  runId: string;
  description: string;
  /** Selection or range to apply to (optional for full-doc suggestions) */
  target?: { from: number; to: number };
  /** Proposed content or patch */
  replacement?: string;
  status: 'pending' | 'applied' | 'rejected';
}

interface AgentState {
  agentPanelSide: AgentPanelSide | null;
  connectionStatus: AgentConnectionStatus;
  connectionError: string | null;
  isChatOpen: boolean;
  /** When chat is open, which thread is active; null = new thread */
  currentThreadId: string | null;
  threads: AgentThread[];
  runHistory: AgentRunResult[];
  pendingSuggestions: PendingSuggestion[];

  setAgentPanelSide: (side: AgentPanelSide | null) => void;
  setConnectionStatus: (status: AgentConnectionStatus, error?: string | null) => void;
  openAgentChat: (threadId?: string | null) => void;
  /** Open chat focused on the thread that contains this run; creates a thread for the run if it has none. */
  openAgentChatForRun: (runId: string) => void;
  closeAgentChat: () => void;
  toggleAgentChat: () => void;
  addRunResult: (result: AgentRunResult, threadId?: string) => void;
  updateRunResult: (id: string, updates: Partial<AgentRunResult>) => void;
  addThread: (thread: AgentThread) => void;
  updateThread: (id: string, updates: Partial<Pick<AgentThread, 'name' | 'runIds' | 'messages' | 'contextDocumentIds'>>) => void;
  setThreadName: (threadId: string, name: string | null) => void;
  addPendingSuggestion: (suggestion: PendingSuggestion) => void;
  applySuggestion: (id: string) => void;
  rejectSuggestion: (id: string) => void;
  clearRunHistory: () => void;
  getThreadByRunId: (runId: string) => AgentThread | undefined;
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agentPanelSide: null,
      connectionStatus: 'disconnected',
      connectionError: null,
      isChatOpen: false,
      currentThreadId: null,
      threads: [],
      runHistory: [],
      pendingSuggestions: [],

      setAgentPanelSide: (side) => set({ agentPanelSide: side }),
      setConnectionStatus: (status, error = null) =>
        set({ connectionStatus: status, connectionError: error ?? null }),
      openAgentChat: (threadId) =>
        set({ isChatOpen: true, currentThreadId: threadId ?? null }),
      openAgentChatForRun: (runId) => {
        const state = get();
        const run = state.runHistory.find((r) => r.id === runId);
        if (!run) return;
        let threadId = run.threadId;
        if (!threadId) {
          const newThread: AgentThread = {
            id: `thread-${Date.now()}`,
            name: run.summary.slice(0, 40) + (run.summary.length > 40 ? '…' : ''),
            runIds: [run.id],
            messages: [],
            createdAt: run.createdAt,
          };
          set((s) => ({
            threads: [newThread, ...s.threads].slice(0, 50),
            runHistory: s.runHistory.map((r) =>
              r.id === runId ? { ...r, threadId: newThread.id } : r
            ),
          }));
          threadId = newThread.id;
        }
        set({ isChatOpen: true, currentThreadId: threadId });
      },
      closeAgentChat: () => set({ isChatOpen: false, currentThreadId: null }),
      toggleAgentChat: () => set({ isChatOpen: !get().isChatOpen }),
      addRunResult: (result, threadId) => {
        const id = result.id;
        const tid = threadId ?? get().currentThreadId;
        const runWithThread = tid ? { ...result, threadId: tid } : result;
        set((s) => {
          const nextHistory = [runWithThread, ...s.runHistory].slice(0, 100);
          if (!tid) return { runHistory: nextHistory };
          return {
            runHistory: nextHistory,
            threads: s.threads.map((t) =>
              t.id === tid ? { ...t, runIds: [id, ...t.runIds] } : t
            ),
          };
        });
      },
      updateRunResult: (id, updates) =>
        set((s) => ({
          runHistory: s.runHistory.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      addThread: (thread) =>
        set((s) => ({ threads: [thread, ...s.threads].slice(0, 50) })),
      updateThread: (id, updates) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      setThreadName: (threadId, name) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId ? { ...t, name } : t
          ),
        })),
      addPendingSuggestion: (suggestion) =>
        set((s) => ({
          pendingSuggestions: [...s.pendingSuggestions, suggestion],
        })),
      applySuggestion: (id) =>
        set((s) => ({
          pendingSuggestions: s.pendingSuggestions.map((p) =>
            p.id === id ? { ...p, status: 'applied' as const } : p
          ),
        })),
      rejectSuggestion: (id) =>
        set((s) => ({
          pendingSuggestions: s.pendingSuggestions.map((p) =>
            p.id === id ? { ...p, status: 'rejected' as const } : p
          ),
        })),
      clearRunHistory: () =>
        set({ runHistory: [], threads: [], currentThreadId: null }),
      getThreadByRunId: (runId) => {
        const run = get().runHistory.find((r) => r.id === runId);
        if (!run?.threadId) return undefined;
        return get().threads.find((t) => t.id === run.threadId);
      },
    }),
    {
      name: 'agent-storage',
      storage: createJSONStorage(() => localStorage, {
        replacer: dateReplacer,
        reviver: dateReviver,
      }),
      partialize: (s) => ({
        agentPanelSide: s.agentPanelSide,
        connectionStatus: s.connectionStatus,
        threads: s.threads,
        runHistory: s.runHistory,
        pendingSuggestions: s.pendingSuggestions,
      }),
    }
  )
);
