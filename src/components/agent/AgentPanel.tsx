import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Bot,
  AlertCircle,
  Check,
  X,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { ImperativePanelGroupHandle } from 'react-resizable-panels';
import { useShallow } from 'zustand/react/shallow';
import { useAgentStore } from '../../store/agentStore';
import { useLayoutStore } from '../../store/layoutStore';
import { useDocumentStore } from '../../store/documentStore';
import { WidgetZone } from '../../types';
import { Button } from '../ui/Button';
import {
  confirmAgentSuggestion,
  getOpenClawAgentStatus,
  fetchAgentState,
  isAgentBackendEnabled,
  rejectAgentSuggestion,
} from '../../lib/agentClient';
import { mapRuns, mapSuggestions, mapThreads } from '../../lib/agentMappers';
import { migrateLegacyAgentData } from '../../lib/agentMigration';
interface AgentPanelProps {
  zone: WidgetZone;
  panelGroupRef: React.RefObject<ImperativePanelGroupHandle>;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({ zone, panelGroupRef }) => {
  const {
    connectionStatus,
    connectionError,
    runHistory,
    threads,
    pendingSuggestions,
    openAgentChat,
    clearRunHistory,
    applySuggestion,
    rejectSuggestion,
    hydrateFromServer,
    setConnectionStatus,
  } = useAgentStore(
    useShallow((s) => ({
      connectionStatus: s.connectionStatus,
      connectionError: s.connectionError,
      runHistory: s.runHistory,
      threads: s.threads,
      pendingSuggestions: s.pendingSuggestions,
      openAgentChat: s.openAgentChat,
      clearRunHistory: s.clearRunHistory,
      applySuggestion: s.applySuggestion,
      rejectSuggestion: s.rejectSuggestion,
      hydrateFromServer: s.hydrateFromServer,
      setConnectionStatus: s.setConnectionStatus,
    }))
  );
  const replaceRange = useDocumentStore((s) => s.replaceRange);
  const isCollapsed = useLayoutStore((state) => {
    const { layoutConfig } = state;
    return zone === 'left' ? layoutConfig.isLeftCollapsed : layoutConfig.isRightCollapsed;
  });
  const toggleZoneCollapsedWithPanelGroup = useLayoutStore(
    (state) => state.toggleZoneCollapsedWithPanelGroup
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [busySuggestionId, setBusySuggestionId] = useState<string | null>(null);
  const migrationAttemptedRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      if (!isAgentBackendEnabled()) {
        setConnectionStatus('error', 'Supabase or agent backend is not configured.');
        return;
      }
      try {
        const status = await getOpenClawAgentStatus();
        if (!status.connected) {
          hydrateFromServer({ threads: [], runHistory: [], pendingSuggestions: [] });
          setConnectionStatus('disconnected', status.mapping?.connection_error ?? null);
          return;
        }

        if (!migrationAttemptedRef.current) {
          migrationAttemptedRef.current = true;
          const localState = useAgentStore.getState();
          await migrateLegacyAgentData({
            threads: localState.threads,
            runs: localState.runHistory,
            suggestions: localState.pendingSuggestions,
          });
        }
        const state = await fetchAgentState('agent');
        if (cancelled) return;
        const threadsMapped = mapThreads(state.threads, state.messages);
        const runsMapped = mapRuns(state.runs);
        const suggestionsMapped = mapSuggestions(state.suggestions);
        const runIdsByThread = runsMapped.reduce<Record<string, string[]>>((acc, run) => {
          if (!run.threadId) return acc;
          if (!acc[run.threadId]) acc[run.threadId] = [];
          acc[run.threadId].push(run.id);
          return acc;
        }, {});
        const hydratedThreads = threadsMapped.map((t) => ({
          ...t,
          runIds: runIdsByThread[t.id] ?? [],
        }));
        hydrateFromServer({
          threads: hydratedThreads,
          runHistory: runsMapped,
          pendingSuggestions: suggestionsMapped,
        });
        setConnectionStatus('connected');
      } catch (error) {
        setConnectionStatus('error', error instanceof Error ? error.message : 'Failed to sync agent state');
      }
    };
    void sync();
    return () => {
      cancelled = true;
    };
  }, [hydrateFromServer, setConnectionStatus]);

  const isLeft = zone === 'left';
  const chevronIcon = isCollapsed
    ? isLeft
      ? <ChevronRight className="w-3.5 h-3.5" />
      : <ChevronLeft className="w-3.5 h-3.5" />
    : isLeft
      ? <ChevronLeft className="w-3.5 h-3.5" />
      : <ChevronRight className="w-3.5 h-3.5" />;
  const controlPosition = isLeft ? 'right-4 top-1/2 -translate-y-1/2' : 'left-4 top-1/2 -translate-y-1/2';
  const headerVisibility = isCollapsed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100';

  return (
    <div className="h-full bg-cream-100 dark:bg-neutral-surface border-neutral-300 dark:border-neutral-700 relative group">
      {/* Collapse/expand chevron */}
      <div
        className={`absolute z-50 w-fit p-0 ${controlPosition} ${headerVisibility} transition-opacity duration-200 ease-in-out`}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleZoneCollapsedWithPanelGroup(zone, panelGroupRef)}
          className="!w-7 !h-7 !min-w-7 !min-h-7 !p-0 flex items-center justify-center text-sage-900 focus:!ring-0 focus:!ring-offset-0 border border-sage-200 dark:border-neutral-700 shadow-sm !bg-sage-100 dark:!bg-neutral-800 hover:!bg-sage-200 dark:hover:!bg-neutral-800"
          title={isCollapsed ? `Expand agent panel` : `Collapse agent panel`}
          aria-label={isCollapsed ? `Expand agent panel` : `Collapse agent panel`}
        >
          {chevronIcon}
        </Button>
      </div>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full p-4 overflow-auto flex flex-col"
          >
            {/* Header: title + status dot + menu */}
            <div className="flex items-center justify-between gap-2 mb-4 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Bot className="w-5 h-5 shrink-0 text-sage-700 dark:text-sage-400" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-text truncate">
                  AI Agent
                </span>
                {connectionStatus === 'connected' && (
                  <span
                    className="w-2 h-2 shrink-0 rounded-full bg-green-500 animate-pulse"
                    title="Connected"
                    aria-hidden
                  />
                )}
                {connectionStatus === 'disconnected' && (
                  <span
                    className="w-2 h-2 shrink-0 rounded-full bg-neutral-400"
                    title="Not connected. Connect in Settings."
                    aria-hidden
                  />
                )}
                {connectionStatus === 'error' && (
                  <AlertCircle
                    className="w-3.5 h-3.5 shrink-0 text-red-600 dark:text-red-400"
                    title={connectionError ?? 'Connection error'}
                  />
                )}
              </div>
              <div className="relative shrink-0" ref={menuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="!w-8 !h-8 !p-0 flex items-center justify-center"
                  aria-label="Agent menu"
                  aria-expanded={menuOpen}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full mt-1 w-44 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-lg z-50"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          openAgentChat();
                          setMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-neutral-900 dark:text-neutral-text hover:bg-sage-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Open chat
                      </button>
                      {runHistory.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            clearRunHistory();
                            setMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-neutral-600 dark:text-neutral-textMuted hover:bg-sage-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Clear history
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {connectionStatus === 'error' && connectionError && (
              <p className="text-xs text-red-600 dark:text-red-400 mb-3">{connectionError}</p>
            )}

            {/* Pending suggestions (apply/reject) */}
            {pendingSuggestions.filter((p) => p.status === 'pending' || p.status === 'needs_confirmation').length > 0 && (
              <div className="shrink-0 mb-4 space-y-2">
                <div className="text-xs font-medium text-neutral-500 dark:text-neutral-textMuted mb-1">
                  Suggestions
                </div>
                {pendingSuggestions
                  .filter((p) => p.status === 'pending' || p.status === 'needs_confirmation')
                  .map((sug) => (
                    <div
                      key={sug.id}
                      className="rounded-lg border border-sage-200 dark:border-sage-800 bg-sage-50/50 dark:bg-sage-900/20 p-2.5 text-xs"
                    >
                      <p className="text-neutral-900 dark:text-neutral-text mb-2">{sug.description}</p>
                      {sug.replacement != null && (
                        <p className="text-neutral-600 dark:text-neutral-textMuted mb-2 font-mono truncate">
                          → {sug.replacement}
                        </p>
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="!py-1 !px-2 text-xs"
                          disabled={busySuggestionId === sug.id}
                          onClick={async () => {
                            try {
                              setBusySuggestionId(sug.id);
                              if (sug.confirmationToken) {
                                await confirmAgentSuggestion(sug.id, sug.confirmationToken);
                              }
                              if (sug.target && sug.replacement != null) {
                                replaceRange(sug.target.from, sug.target.to, sug.replacement);
                              }
                              applySuggestion(sug.id);
                            } finally {
                              setBusySuggestionId(null);
                            }
                          }}
                        >
                          <Check className="w-3 h-3 mr-0.5" />
                          Apply
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="!py-1 !px-2 text-xs"
                          disabled={busySuggestionId === sug.id}
                          onClick={async () => {
                            try {
                              setBusySuggestionId(sug.id);
                              if (sug.confirmationToken) {
                                await rejectAgentSuggestion(sug.id);
                              }
                              rejectSuggestion(sug.id);
                            } finally {
                              setBusySuggestionId(null);
                            }
                          }}
                        >
                          <X className="w-3 h-3 mr-0.5" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Chats: one card per thread (conversation) */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-textMuted mb-2">
                Chats
              </div>
              {threads.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center py-6">
                  <p className="text-xs text-neutral-400 dark:text-neutral-textMuted">
                    Start a conversation via Open chat. Each chat appears here as a card.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto">
                  {(() => {
                    // Sort threads by last message time (or thread createdAt if no messages)
                    const sortedThreads = [...threads].sort((a, b) => {
                      const aLast = a.messages[a.messages.length - 1];
                      const bLast = b.messages[b.messages.length - 1];
                      const aTime = aLast?.timestamp ?? a.createdAt;
                      const bTime = bLast?.timestamp ?? b.createdAt;
                      return new Date(bTime).getTime() - new Date(aTime).getTime();
                    });
                    return sortedThreads.map((thread) => {
                      const lastMsg = thread.messages.length > 0
                        ? thread.messages[thread.messages.length - 1]
                        : null;
                      const displayName = thread.name || 'New chat';
                      const lastTime = lastMsg?.timestamp ?? thread.createdAt;
                      const lastPreview = lastMsg
                        ? (lastMsg.role === 'user' ? 'You: ' : 'Agent: ') +
                          (lastMsg.content.slice(0, 36) + (lastMsg.content.length > 36 ? '…' : ''))
                        : 'No messages yet';
                      return (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => openAgentChat(thread.id)}
                          className="w-full text-left rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-2.5 text-xs hover:border-sage-400 dark:hover:border-sage-600 hover:bg-sage-50/50 dark:hover:bg-sage-900/20 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="font-medium text-neutral-900 dark:text-neutral-text truncate">
                              {displayName}
                            </span>
                            <span className="text-neutral-500 dark:text-neutral-textMuted shrink-0">
                              {new Date(lastTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-neutral-600 dark:text-neutral-textMuted line-clamp-1">
                            {lastPreview}
                          </p>
                        </button>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
