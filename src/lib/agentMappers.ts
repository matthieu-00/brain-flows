import type { AgentChatMessage, AgentRunResult, AgentThread, PendingSuggestion } from '../store/agentStore';
import type { AgentMessageRow, AgentRunRow, AgentSuggestionRow, AgentThreadRow } from './agentClient';

export function mapThreads(rows: AgentThreadRow[], messageRows: AgentMessageRow[]): AgentThread[] {
  return rows.map((thread) => {
    const messages: AgentChatMessage[] = messageRows
      .filter((m) => m.thread_id === thread.id)
      .map((m) => ({
        id: m.id,
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
        timestamp: m.created_at,
      }));
    return {
      id: thread.id,
      name: thread.name,
      runIds: [],
      messages,
      createdAt: thread.created_at,
    };
  });
}

export function mapRuns(rows: AgentRunRow[]): AgentRunResult[] {
  return rows.map((run) => ({
    id: run.id,
    type: 'message',
    summary: run.summary || 'Agent run',
    status: run.status,
    createdAt: run.created_at,
    threadId: run.thread_id,
    payload: run.response_payload,
  }));
}

export function mapSuggestions(rows: AgentSuggestionRow[]): PendingSuggestion[] {
  return rows.map((s) => ({
    id: s.id,
    runId: s.run_id,
    description: s.description,
    target: s.target?.from != null && s.target?.to != null
      ? {
          from: s.target.from,
          to: s.target.to,
          documentId: s.target.documentId,
        }
      : undefined,
    replacement: s.replacement,
    status: s.status,
    confirmationToken: s.confirmation_token,
  }));
}
