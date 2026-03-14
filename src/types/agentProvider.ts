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

export interface SendMessageInput {
  message: string;
  context: DocumentContext;
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
