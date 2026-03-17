import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, Pencil, FileText, ChevronDown, CheckSquare, Square, Paperclip, Download, X, Copy as CopyIcon, Quote as QuoteIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAgentStore } from '../../store/agentStore';
import { useDocumentStore } from '../../store/documentStore';
import { useToastStore } from '../../store/toastStore';
import type { PendingSuggestion, AgentChatMessage, AgentChatAttachment } from '../../store/agentStore';
import { sendAgentMessage } from '../../lib/agentClient';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

function base64ToBlob(base64: string, mimeType?: string): Blob {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mimeType || 'application/octet-stream' });
}

function downloadAttachment(att: AgentChatAttachment): void {
  const blob = base64ToBlob(att.content, att.mimeType);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = att.name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Match @mention: @ followed by one or more words (allows spaces in title); ends at space-before-next-word or end */
const MENTION_RE = /(@(?:[^@\s]+(?:\s+[^@\s]+)*))(?=\s(?:$|\S)|$)/g;

/** Split content into plain text and @mention segments for rendering */
function parseContentWithMentions(content: string): Array<{ type: 'text' | 'mention'; value: string }> {
  const segments: Array<{ type: 'text' | 'mention'; value: string }> = [];
  const re = new RegExp(MENTION_RE.source, 'g');
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: 'text', value: content.slice(lastIndex, m.index) });
    }
    segments.push({ type: 'mention', value: m[1].slice(1).trim() }); // drop leading @
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.slice(lastIndex) });
  }
  return segments.length ? segments : [{ type: 'text', value: content }];
}

export const AgentChatModal: React.FC = () => {
  const {
    isChatOpen,
    currentThreadId,
    threads,
    connectionStatus,
    closeAgentChat,
    addRunResult,
    addThread,
    updateThread,
    setThreadName,
    addPendingSuggestion,
  } = useAgentStore();
  const { currentDocument, selection, documents } = useDocumentStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quotedSnippet, setQuotedSnippet] = useState<{
    text: string;
    messageId?: string;
    role?: 'user' | 'assistant';
  } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [showDocsDropdown, setShowDocsDropdown] = useState(false);
  /** When no thread yet, selection is kept here and applied when thread is created */
  const [pendingContextDocumentIds, setPendingContextDocumentIds] = useState<string[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<AgentChatAttachment[]>([]);
  /** Draft message and attachments per thread (key = threadId or '__new__'); preserves context when switching threads */
  const [draftsByThread, setDraftsByThread] = useState<
    Record<string, { message: string; pendingAttachments: AgentChatAttachment[] }>
  >({});
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionHighlightIndex, setMentionHighlightIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const docsDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);
  /** Cursor position when @ dropdown is open; used on insert because click blurs input and selectionStart becomes 0 */
  const mentionCursorRef = useRef<number>(0);
  const draftsByThreadRef = useRef(draftsByThread);
  draftsByThreadRef.current = draftsByThread;

  const currentThread = currentThreadId
    ? threads.find((t) => t.id === currentThreadId)
    : null;

  const filteredMentionDocs = documents.filter(
    (d) =>
      !mentionQuery ||
      (d.title || 'Untitled').toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const draftKey = currentThreadId ?? '__new__';

  // Load thread messages and that thread's draft when switching threads (read drafts from ref so we don't depend on draftsByThread and re-run on every keystroke)
  useEffect(() => {
    if (!isChatOpen) return;
    if (currentThreadId && currentThread) {
      setMessages(currentThread.messages);
      setDraftName(currentThread.name ?? '');
    } else {
      setMessages([]);
      setDraftName('');
    }
    setEditingName(false);
    const draft = draftsByThreadRef.current[draftKey];
    setMessage(draft?.message ?? '');
    setPendingAttachments(draft?.pendingAttachments ?? []);
  }, [isChatOpen, currentThreadId, currentThread, draftKey]);

  // Persist current draft into the per-thread map whenever message or pendingAttachments change
  useEffect(() => {
    setDraftsByThread((prev) => ({
      ...prev,
      [draftKey]: { message, pendingAttachments },
    }));
  }, [draftKey, message, pendingAttachments]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (isChatOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isChatOpen, messages]);

  const handleMouseUpSelection = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const anchorNode = sel.anchorNode;
    const focusNode = sel.focusNode;
    const isInContainer =
      (anchorNode && container.contains(anchorNode)) ||
      (focusNode && container.contains(focusNode));
    if (!isInContainer) return;

    const text = sel.toString().trim();
    if (!text) return;

    let node: Node | null = anchorNode;
    let messageId: string | undefined;
    let role: 'user' | 'assistant' | undefined;
    while (node && node !== container) {
      if (node instanceof HTMLElement && node.dataset.messageId) {
        messageId = node.dataset.messageId;
        role = (node.dataset.role as 'user' | 'assistant') || undefined;
        break;
      }
      node = node.parentNode;
    }

    setQuotedSnippet({ text, messageId, role });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showDocsDropdown && docsDropdownRef.current && !docsDropdownRef.current.contains(e.target as Node)) {
        setShowDocsDropdown(false);
      }
      if (showMentionDropdown && mentionDropdownRef.current && !mentionDropdownRef.current.contains(e.target as Node)) {
        setShowMentionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDocsDropdown, showMentionDropdown]);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart ?? 0;
    setMessage(value);
    const lastAt = value.lastIndexOf('@', cursor - 1);
    if (lastAt !== -1) {
      const afterAt = value.slice(lastAt + 1, cursor);
      if (!/\s/.test(afterAt)) {
        setShowMentionDropdown(true);
        setMentionStartIndex(lastAt);
        setMentionQuery(afterAt);
        setMentionHighlightIndex(0);
        mentionCursorRef.current = cursor;
        return;
      }
    }
    setShowMentionDropdown(false);
  }, []);

  const insertMention = useCallback((docTitle: string) => {
    const cursor = mentionCursorRef.current ?? chatInputRef.current?.selectionStart ?? message.length;
    const before = message.slice(0, mentionStartIndex);
    const after = message.slice(cursor);
    const insert = `@${docTitle} `;
    const newMsg = before + insert + after;
    setMessage(newMsg);
    setShowMentionDropdown(false);
  }, [message, mentionStartIndex]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    const rejected: string[] = [];
    const toAdd: AgentChatAttachment[] = [];
    let pending = 0;
    const checkDone = () => {
      if (pending > 0) return;
      if (toAdd.length) setPendingAttachments((prev) => [...prev, ...toAdd]);
      if (rejected.length) {
        useToastStore.getState().addToast(`Skipped: ${rejected.join('; ')}. Max 5MB; allowed: images, PDF, Word.`, 'warning');
      }
    };
    files.forEach((file, index) => {
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name} (too large)`);
        return;
      }
      const mime = (file.type || '').toLowerCase();
      const allowed =
        ALLOWED_MIME_TYPES.some((t) => t === mime) ||
        /^image\/(jpeg|jpg|png)$/.test(mime) ||
        mime === 'application/pdf' ||
        mime.includes('word') ||
        mime.includes('document');
      if (!allowed) {
        rejected.push(`${file.name} (type not allowed)`);
        return;
      }
      pending++;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl;
        toAdd.push({
          id: `att-${Date.now()}-${index}`,
          name: file.name,
          mimeType: file.type || undefined,
          content: base64,
        });
        pending--;
        checkDone();
      };
      reader.onerror = () => {
        rejected.push(`${file.name} (read failed)`);
        pending--;
        checkDone();
      };
      reader.readAsDataURL(file);
    });
    if (pending === 0) checkDone();
  }, []);

  const sendMessage = async () => {
    const text = message.trim();
    const hasAttachments = pendingAttachments.length > 0;
    if (!text && !hasAttachments) return;
    if (connectionStatus !== 'connected') {
      useToastStore.getState().addToast('Connect your dedicated OpenClaw agent in Settings before sending messages.', 'warning');
      return;
    }

    const composedContent =
      (quotedSnippet?.text
        ? `> ${quotedSnippet.text}\n\n${text}`
        : text) || (hasAttachments ? '(attachment)' : '');

    const userMsg: AgentChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: composedContent,
      timestamp: new Date().toISOString(),
      attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setMessage('');
    setPendingAttachments([]);
    setQuotedSnippet(null);
    setIsLoading(true);

    try {
      const docs = useDocumentStore.getState().documents;
      const contextIds = useAgentStore.getState().currentThreadId
        ? (useAgentStore.getState().threads.find((t) => t.id === useAgentStore.getState().currentThreadId)?.contextDocumentIds ?? [])
        : pendingContextDocumentIds;
      const extraDocs = contextIds.map((id) => docs.find((d) => d.id === id)).filter((d): d is NonNullable<typeof d> => d != null);
      const atMentionTitles = [...text.matchAll(MENTION_RE)].map((m) => m[1].trim()).filter(Boolean);
      const mentionedDocs = atMentionTitles
        .map((title) => docs.find((d) => (d.title || 'Untitled').trim() === title))
        .filter((d): d is NonNullable<typeof d> => d != null);
      const seenIds = new Set<string>();
      const contextDocs = [
        ...(currentDocument ? [currentDocument] : []),
        ...extraDocs,
        ...mentionedDocs,
      ].filter((d) => {
        if (seenIds.has(d.id)) return false;
        seenIds.add(d.id);
        return true;
      });
      const contextDocumentIds = contextDocs.map((d) => d.id);
      const state = useAgentStore.getState();
      const threadName = !state.currentThreadId
        ? (text.length <= 40 ? text : `${text.slice(0, 37)}…`)
        : undefined;

      const response = await sendAgentMessage({
        surface: 'agent',
        threadId: state.currentThreadId ?? undefined,
        threadName,
        message: text,
        contextDocumentIds,
        currentDocumentId: currentDocument?.id ?? null,
        selection: selection
          ? { from: selection.from, to: selection.to, text: selection.text }
          : null,
        quotedSnippet: quotedSnippet
          ? { text: quotedSnippet.text, role: quotedSnippet.role, source: 'chat_message' }
          : null,
      });

      const assistantMsg: AgentChatMessage = {
        id: response.assistantMessage.id,
        role: 'assistant',
        content: response.assistantMessage.content,
        timestamp: response.assistantMessage.created_at,
      };

      const nextMessages = [...messages, userMsg, assistantMsg];
      setMessages(nextMessages);

      const threadId = response.thread.id;
      if (!state.currentThreadId) {
        addThread({
          id: threadId,
          name: response.thread.name || threadName || null,
          runIds: [response.run.id],
          messages: nextMessages,
          createdAt: response.thread.created_at,
          contextDocumentIds: contextDocumentIds.length > 0 ? contextDocumentIds : undefined,
        });
        useAgentStore.setState({ currentThreadId: threadId });
      } else {
        updateThread(threadId, {
          messages: nextMessages,
          name: response.thread.name || state.threads.find((t) => t.id === threadId)?.name || null,
        });
      }

      addRunResult(
        {
          id: response.run.id,
          type: 'message',
          summary: response.run.summary || 'Agent response ready.',
          status: response.run.status,
          createdAt: response.run.created_at,
          threadId,
        },
        threadId
      );

      if (response.suggestions.length > 0) {
        response.suggestions.forEach((sug) => {
          const mapped: PendingSuggestion = {
            id: sug.id,
            runId: sug.run_id,
            description: sug.description,
            target: sug.target?.from != null && sug.target?.to != null
              ? { from: sug.target.from, to: sug.target.to, documentId: sug.target.documentId }
              : undefined,
            replacement: sug.replacement,
            status: sug.status,
            confirmationToken: sug.confirmation_token,
          };
          addPendingSuggestion(mapped);
        });
        useToastStore.getState().addToast('Suggestion queued for confirmation in the agent panel.', 'success');
      } else {
        useToastStore.getState().addToast('Agent result ready. Check the panel.', 'info');
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Failed to contact agent backend.';
      const fallbackAssistant: AgentChatMessage = {
        id: `a-err-${Date.now()}`,
        role: 'assistant',
        content: `I could not process that request right now: ${messageText}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackAssistant]);
      useToastStore.getState().addToast(messageText, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    closeAgentChat();
  }, [closeAgentChat]);

  const handleSaveName = useCallback(() => {
    if (currentThreadId && draftName.trim()) {
      setThreadName(currentThreadId, draftName.trim());
    }
    setEditingName(false);
  }, [currentThreadId, draftName, setThreadName]);

  return (
    <Modal
      isOpen={isChatOpen}
      onClose={handleClose}
      size="lg"
      initialFocusRef={chatInputRef}
      header={
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-text">
            AI Agent
          </span>
          <div className="flex-1 flex justify-center min-w-0">
            {currentThreadId ? (
              editingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') {
                      setDraftName(currentThread?.name ?? '');
                      setEditingName(false);
                    }
                  }}
                  className="h-8 px-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-text max-w-xs w-full focus:outline-none focus:ring-2 focus:ring-sage-600 focus:border-sage-500 dark:focus:border-sage-500"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="h-8 flex items-center gap-1.5 min-w-0 px-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left max-w-xs w-full justify-center"
                >
                  <span className="font-medium text-neutral-900 dark:text-neutral-text truncate">
                    {currentThread?.name || 'Untitled thread'}
                  </span>
                  <Pencil className="w-3 h-3 shrink-0 text-neutral-400" />
                </button>
              )
            ) : (
              <span className="text-sm text-neutral-500 dark:text-neutral-textMuted">
                New conversation
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="p-2 shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col h-[65vh] min-h-[320px]">

        {/* Row 2 continued: Current document + included docs as pills, Include more documents */}
        <div className="flex items-center gap-2 mb-2 flex-wrap" ref={docsDropdownRef}>
          {currentDocument && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-600 border border-neutral-200 dark:border-neutral-500 text-xs text-neutral-800 dark:text-neutral-200">
              <FileText className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
              @{currentDocument.title}
            </span>
          )}
          {(currentThread?.contextDocumentIds ?? pendingContextDocumentIds).length > 0 &&
            (() => {
              const ids = currentThread?.contextDocumentIds ?? pendingContextDocumentIds;
              const currentId = currentDocument?.id;
              const docs = ids
                .map((id) => documents.find((d) => d.id === id))
                .filter((d): d is NonNullable<typeof d> => d != null && d.id !== currentId);
              return docs.map((doc) => (
                <span
                  key={doc.id}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-600 border border-neutral-200 dark:border-neutral-500 text-xs text-neutral-800 dark:text-neutral-200"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                  @{doc.title || 'Untitled'}
                </span>
              ));
            })()}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDocsDropdown((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs text-sage-600 dark:text-sage-400 hover:underline"
              aria-expanded={showDocsDropdown}
              aria-label="Include more documents in chat context"
            >
              <FileText className="w-3.5 h-3.5" />
              Include more documents
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {showDocsDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute left-0 top-full mt-1 w-64 max-h-60 overflow-auto bg-white dark:bg-neutral-surface rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50"
              >
                <div className="flex gap-2 px-3 pb-2 border-b border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = documents.map((d) => d.id);
                      if (currentThreadId) {
                        updateThread(currentThreadId, { contextDocumentIds: allIds });
                      } else {
                        setPendingContextDocumentIds(allIds);
                      }
                    }}
                    className="text-xs text-sage-600 dark:text-sage-400 hover:underline"
                  >
                    Check all
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentThreadId) {
                        updateThread(currentThreadId, { contextDocumentIds: [] });
                      } else {
                        setPendingContextDocumentIds([]);
                      }
                    }}
                    className="text-xs text-sage-600 dark:text-sage-400 hover:underline"
                  >
                    Uncheck all
                  </button>
                </div>
                <div className="px-2 pt-2 space-y-0.5">
                  {documents.map((doc) => {
                    const selectedIds = currentThread?.contextDocumentIds ?? pendingContextDocumentIds;
                    const isChecked = selectedIds.includes(doc.id);
                    return (
                      <label
                        key={doc.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-sm"
                      >
                        <span className="flex shrink-0 mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-sage-600 dark:text-sage-400" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-400" />
                          )}
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const next = isChecked
                              ? selectedIds.filter((id) => id !== doc.id)
                              : [...selectedIds, doc.id];
                            if (currentThreadId) {
                              updateThread(currentThreadId, { contextDocumentIds: next });
                            } else {
                              setPendingContextDocumentIds(next);
                            }
                          }}
                          className="sr-only"
                        />
                        <span className="truncate text-neutral-900 dark:text-neutral-text">{doc.title || 'Untitled'}</span>
                      </label>
                    );
                  })}
                  {documents.length === 0 && (
                    <p className="px-2 py-2 text-xs text-neutral-500 dark:text-neutral-textMuted">No documents yet</p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 p-3 space-y-3"
          onMouseUp={handleMouseUpSelection}
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 dark:text-neutral-textMuted">
              <Bot className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">Ask for suggestions, research, or spell check.</p>
              <p className="text-xs mt-1">Results will appear in the agent panel. Click a thread there to continue.</p>
            </div>
          )}
          <AnimatePresence>
            {messages.map((msg) => {
              const senderLabel = msg.role === 'user' ? 'You' : 'Agent';
              const timeLabel =
                msg.timestamp &&
                new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
              const tooltip = timeLabel ? `${senderLabel} • ${timeLabel}` : senderLabel;

              // When a message includes a quoted snippet, it is encoded as:
              // `> quoted text\n\nrest of message`. Split that into a styled
              // quote block and the remaining body for clearer visuals.
              let quoteText: string | null = null;
              let bodyText = msg.content;
              if (bodyText.startsWith('> ')) {
                const splitIdx = bodyText.indexOf('\n\n');
                if (splitIdx !== -1) {
                  quoteText = bodyText.slice(2, splitIdx);
                  bodyText = bodyText.slice(splitIdx + 2);
                }
              }

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    data-message-id={msg.id}
                    data-role={msg.role}
                    title={tooltip}
                    className={`group relative max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-sage-600 text-white'
                        : 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-text border border-neutral-200 dark:border-neutral-600'
                    }`}
                  >
                  {quoteText && (
                    <div
                      className={`mb-2 px-2 py-1 rounded-md text-xs border ${
                        msg.role === 'user'
                          ? 'bg-sage-500/60 border-sage-400/70'
                          : 'bg-neutral-100 dark:bg-neutral-600 border-neutral-200 dark:border-neutral-500'
                      }`}
                    >
                      <span className="whitespace-pre-wrap">{quoteText}</span>
                    </div>
                  )}
                  {bodyText && (
                    <span className="whitespace-pre-wrap">
                      {parseContentWithMentions(bodyText).map((seg, i) =>
                        seg.type === 'mention' ? (
                          <span
                            key={i}
                            className={
                              msg.role === 'user'
                                ? 'inline-flex align-middle px-2 py-0.5 rounded bg-white/25 text-white border border-white/30 mx-0.5 first:ml-0 last:mr-0'
                                : 'inline-flex align-middle px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-500 mx-0.5 first:ml-0 last:mr-0'
                            }
                          >
                            @{seg.value}
                          </span>
                        ) : (
                          <span key={i}>{seg.value}</span>
                        )
                      )}
                    </span>
                  )}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.attachments.map((att) => (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() => downloadAttachment(att)}
                          className={`flex items-center gap-1.5 w-full text-left px-2 py-1 rounded text-xs ${
                            msg.role === 'user'
                              ? 'bg-sage-700/50 hover:bg-sage-700 text-white'
                              : 'bg-neutral-100 dark:bg-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-500 text-neutral-900 dark:text-neutral-text'
                          }`}
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{att.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div
                    className={`mt-1 flex gap-1 justify-end text-[11px] transition-opacity ${
                      msg.role === 'user'
                        ? 'text-sage-50/80 group-hover:opacity-100 opacity-80'
                        : 'text-neutral-500 dark:text-neutral-300 group-hover:opacity-100 opacity-80'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                          navigator.clipboard.writeText(msg.content).catch(() => {
                            // ignore clipboard errors
                          });
                        }
                      }}
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                      aria-label="Copy message"
                    >
                      <CopyIcon className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuotedSnippet({ text: msg.content, messageId: msg.id, role: msg.role })}
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                      aria-label="Quote message"
                    >
                      <QuoteIcon className="w-3 h-3" />
                    </button>
                  </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-sm text-neutral-500">
                Thinking…
              </div>
            </div>
          )}
        </div>

        {quotedSnippet && (
          <div className="mt-2 flex items-start gap-2">
            <div className="flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-xs text-neutral-800 dark:text-neutral-100">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="font-medium text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-300">
                  Quoted {quotedSnippet.role === 'user' ? 'you' : 'assistant'}
                </span>
                <button
                  type="button"
                  onClick={() => setQuotedSnippet(null)}
                  className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600"
                  aria-label="Remove quoted snippet"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs max-h-16 overflow-y-auto whitespace-pre-wrap">
                {quotedSnippet.text}
              </p>
            </div>
          </div>
        )}

        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {pendingAttachments.map((att) => (
              <span
                key={att.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700 text-xs"
              >
                <span className="truncate max-w-[120px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() => setPendingAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                  className="p-0.5 rounded hover:bg-neutral-300 dark:hover:bg-neutral-600"
                  aria-label={`Remove ${att.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2 mt-3" ref={mentionDropdownRef}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_MIME_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            aria-hidden
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <div className="flex-1 relative min-w-0">
            <input
              ref={chatInputRef}
              type="text"
              value={message}
              onChange={handleMessageChange}
              onKeyDown={(e) => {
                if (showMentionDropdown) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setMentionHighlightIndex((i) =>
                      Math.min(i + 1, Math.max(0, filteredMentionDocs.length - 1))
                    );
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setMentionHighlightIndex((i) => Math.max(0, i - 1));
                    return;
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const doc = filteredMentionDocs[
                      Math.min(mentionHighlightIndex, filteredMentionDocs.length - 1)
                    ];
                    if (doc) {
                      insertMention(doc.title || 'Untitled');
                      setShowMentionDropdown(false);
                    }
                    return;
                  }
                  if (e.key === 'Escape') {
                    setShowMentionDropdown(false);
                    return;
                  }
                }
                if (e.key === 'Escape' && quotedSnippet) {
                  e.preventDefault();
                  setQuotedSnippet(null);
                  return;
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message… (use @ to mention a document)"
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-text placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-sage-600 focus:border-sage-500 dark:focus:border-sage-500"
              disabled={isLoading}
              aria-label="Chat message"
            />
            {showMentionDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 right-0 bottom-full mb-1 max-h-48 overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-surface shadow-lg py-2 px-1.5 z-50 flex flex-col gap-1"
              >
                {filteredMentionDocs.map((doc, idx) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => insertMention(doc.title || 'Untitled')}
                    className={`w-full px-2.5 py-1.5 text-left text-sm flex items-center gap-2 rounded-lg border transition-colors ${
                      idx === mentionHighlightIndex
                        ? 'bg-sage-100 dark:bg-sage-900/40 border-sage-300 dark:border-sage-700 text-sage-900 dark:text-sage-100'
                        : 'bg-neutral-100 dark:bg-neutral-600 border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-500 text-neutral-900 dark:text-neutral-text'
                    }`}
                    aria-selected={idx === mentionHighlightIndex}
                  >
                    <FileText className="w-4 h-4 shrink-0 text-neutral-400" />
                    <span className="truncate">@{doc.title || 'Untitled'}</span>
                  </button>
                ))}
                {filteredMentionDocs.length === 0 && (
                  <p className="px-3 py-2 text-xs text-neutral-500 dark:text-neutral-textMuted">
                    No matching documents
                  </p>
                )}
              </motion.div>
            )}
          </div>
          <button
            type="button"
            onClick={sendMessage}
            disabled={(!message.trim() && !pendingAttachments.length) || isLoading}
            className="p-2 rounded-lg bg-sage-600 text-white hover:bg-sage-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
