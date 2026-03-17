import { isSupabaseConfigured, requireSupabase } from './supabaseClient';

export type AgentSurface = 'agent' | 'widget';
export type DedicatedAgentConnectionStatus = 'connected' | 'disconnected' | 'error';

export interface AgentMessageRow {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface AgentThreadRow {
  id: string;
  user_id: string;
  surface: AgentSurface;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentRunRow {
  id: string;
  thread_id: string;
  run_type: string;
  status: 'queued' | 'running' | 'needs_confirmation' | 'completed' | 'failed' | 'blocked';
  summary: string | null;
  created_at: string;
  response_payload?: Record<string, unknown>;
}

export interface AgentSuggestionRow {
  id: string;
  run_id: string;
  thread_id: string;
  description: string;
  target?: { documentId?: string; from?: number; to?: number };
  replacement?: string;
  status: 'needs_confirmation' | 'applied' | 'rejected' | 'blocked';
  confirmation_token: string;
  created_at: string;
}

interface AgentFunctionResponse<T> {
  ok: boolean;
  error?: string;
  correlationId?: string;
  data?: T;
}

export interface OpenClawAgentMapping {
  user_id: string;
  agent_id: string;
  workspace_path?: string | null;
  auth_profile_ref?: string | null;
  status: DedicatedAgentConnectionStatus;
  key_last4?: string | null;
  connection_error?: string | null;
  connected_at?: string | null;
  last_validated_at?: string | null;
}

const functionName = import.meta.env.VITE_AGENT_FUNCTION_NAME || 'agent-gateway';
const backendFlag = (import.meta.env.VITE_AGENT_BACKEND_ENABLED || 'true').toLowerCase();

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  if (!isAgentBackendEnabled()) {
    throw new Error('Agent backend is disabled or Supabase is not configured.');
  }
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) throw new Error(error.message || 'Agent function failed');
  const response = data as AgentFunctionResponse<T> | T;
  if ((response as AgentFunctionResponse<T>).ok === false) {
    throw new Error((response as AgentFunctionResponse<T>).error || 'Agent request failed');
  }
  if ((response as AgentFunctionResponse<T>).ok === true && (response as AgentFunctionResponse<T>).data) {
    return (response as AgentFunctionResponse<T>).data as T;
  }
  return response as T;
}

export function isAgentBackendEnabled(): boolean {
  return isSupabaseConfigured && backendFlag !== 'false' && backendFlag !== '0';
}

export async function fetchAgentState(surface: AgentSurface = 'agent'): Promise<{
  threads: AgentThreadRow[];
  messages: AgentMessageRow[];
  runs: AgentRunRow[];
  suggestions: AgentSuggestionRow[];
}> {
  return invoke({
    action: 'fetchState',
    surface,
  });
}

export async function getOpenClawAgentStatus(): Promise<{
  connected: boolean;
  mapping: OpenClawAgentMapping | null;
}> {
  return invoke({
    action: 'getOpenClawAgentStatus',
  });
}

export async function connectOpenClawAgent(payload: {
  agentId: string;
  workspacePath?: string;
  authProfileRef?: string;
  keyLast4?: string;
}): Promise<{
  connected: boolean;
  mapping: OpenClawAgentMapping;
}> {
  return invoke({
    action: 'connectOpenClawAgent',
    ...payload,
  });
}

export async function disconnectOpenClawAgent(): Promise<{
  connected: boolean;
  mapping: OpenClawAgentMapping | null;
}> {
  return invoke({
    action: 'disconnectOpenClawAgent',
  });
}

export async function sendAgentMessage(payload: {
  surface?: AgentSurface;
  threadId?: string;
  threadName?: string;
  message: string;
  contextDocumentIds?: string[];
  currentDocumentId?: string | null;
  selection?: { from: number; to: number; text: string } | null;
  quotedSnippet?: { text: string; role?: 'user' | 'assistant'; source?: string } | null;
}): Promise<{
  thread: AgentThreadRow;
  run: AgentRunRow;
  userMessage: AgentMessageRow;
  assistantMessage: AgentMessageRow;
  suggestions: AgentSuggestionRow[];
}> {
  return invoke({
    action: 'sendMessage',
    ...payload,
  });
}

export async function confirmAgentSuggestion(
  suggestionId: string,
  confirmationToken: string
): Promise<void> {
  await invoke({
    action: 'confirmSuggestion',
    suggestionId,
    confirmationToken,
  });
}

export async function rejectAgentSuggestion(suggestionId: string): Promise<void> {
  await invoke({
    action: 'rejectSuggestion',
    suggestionId,
  });
}
