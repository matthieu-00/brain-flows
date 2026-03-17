/**
 * Provider interface for AI agent integration (e.g. OpenClaw).
 * Implement this when connecting to a real backend; the app uses a mock implementation until then.
 */

import type { DocumentSelection } from '../store/documentStore';
import type { AgentRunResult, PendingSuggestion } from '../store/agentStore';

export interface DocumentContext {
  documentId: string;
  title: string;
  content: string;
  wordCount: number;
  selection: DocumentSelection | null;
}

/**
 * Optional structured representation of a quoted snippet the user is asking about.
 * This allows the backend to treat the quote as first-class metadata instead of
 * relying only on text prefixing in the message body.
 */
export interface QuotedSnippet {
  /** Raw text content of the quote (already trimmed/normalized on the client). */
  text: string;
  /**
   * Where the quote came from. This can be extended later (e.g. 'document',
   * 'chat_message', 'selection_only'), but we start with concrete values.
   */
  source:
    | 'chat_message' // quoted from a prior chat message bubble
    | 'document_selection'; // quoted from an editor/document selection
  /** Optional id of the message the quote was taken from (if applicable). */
  messageId?: string;
  /** Optional thread id the quoted message belongs to. */
  threadId?: string;
  /** Role of the original message, when source === 'chat_message'. */
  role?: 'user' | 'assistant';
}

export interface SendMessageInput {
  message: string;
  context: DocumentContext;
  /**
   * Optional structured quote the user highlighted (e.g. from a previous
   * assistant message or the current document selection).
   *
   * When present, backends should treat this as a strong pointer to the
   * specific text span the user is asking about, and may include it
   * separately from the free-form `message` in prompts or tools.
   */
  quotedSnippet?: QuotedSnippet;
}

export interface SendMessageResult {
  runId: string;
  message: string;
  suggestions?: Omit<PendingSuggestion, 'id' | 'runId' | 'status'>[];
}

export interface AgentProvider {
  /** Human-readable name (e.g. "OpenClaw") */
  name: string;
  /** Check if the provider is connected and ready */
  isConnected(): boolean;
  /** Connect (e.g. OAuth or API key). Returns success or error message. */
  connect(config?: Record<string, string>): Promise<{ ok: true } | { ok: false; error: string }>;
  /** Disconnect and clear stored credentials */
  disconnect(): Promise<void>;
  /** Send a user message and optional document context; returns run id and optional suggestions */
  sendMessage(input: SendMessageInput): Promise<SendMessageResult>;
  /** Optional: subscribe to run updates (e.g. streaming, status changes) */
  subscribeToRun?(runId: string, onUpdate: (result: Partial<AgentRunResult>) => void): () => void;
}
