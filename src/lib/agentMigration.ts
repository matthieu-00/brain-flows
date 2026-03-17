import type { AgentRunResult, AgentThread, PendingSuggestion } from '../store/agentStore';
import { isAgentBackendEnabled } from './agentClient';
import { isSupabaseConfigured, requireSupabase } from './supabaseClient';

function mapRunStatus(status: AgentRunResult['status']) {
  if (status === 'needs_confirmation') return 'needs_confirmation';
  if (status === 'queued') return 'queued';
  if (status === 'running') return 'running';
  if (status === 'failed') return 'failed';
  if (status === 'blocked') return 'blocked';
  return 'completed';
}

function mapSuggestionStatus(status: PendingSuggestion['status']) {
  if (status === 'applied') return 'applied';
  if (status === 'rejected') return 'rejected';
  if (status === 'blocked') return 'blocked';
  return 'needs_confirmation';
}

export async function migrateLegacyAgentData(payload: {
  threads: AgentThread[];
  runs: AgentRunResult[];
  suggestions: PendingSuggestion[];
}): Promise<void> {
  if (!isSupabaseConfigured || !isAgentBackendEnabled()) return;
  const supabase = requireSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const key = `agent-migrated-${user.id}`;
  if (localStorage.getItem(key) === 'true') return;

  if (payload.threads.length === 0) {
    localStorage.setItem(key, 'true');
    return;
  }

  const threadIdMap = new Map<string, string>();
  const runIdMap = new Map<string, string>();
  for (const thread of payload.threads) {
    threadIdMap.set(thread.id, crypto.randomUUID());
  }
  for (const run of payload.runs) {
    runIdMap.set(run.id, crypto.randomUUID());
  }

  const threadRows = payload.threads.map((thread) => ({
    id: threadIdMap.get(thread.id),
    user_id: user.id,
    surface: 'agent',
    name: thread.name,
    created_at: thread.createdAt,
    updated_at: thread.createdAt,
  }));
  const { error: threadError } = await supabase.from('agent_threads').insert(threadRows);
  if (threadError) return;

  const messageRows = payload.threads.flatMap((thread) =>
    thread.messages.map((message) => ({
      id: crypto.randomUUID(),
      user_id: user.id,
      thread_id: threadIdMap.get(thread.id),
      role: message.role,
      content: message.content,
      metadata: {},
      created_at: message.timestamp,
    }))
  );
  if (messageRows.length > 0) {
    const { error: messageError } = await supabase.from('agent_messages').insert(messageRows);
    if (messageError) return;
  }

  const runRows = payload.runs.map((run) => ({
    id: runIdMap.get(run.id),
    user_id: user.id,
    thread_id: run.threadId ? threadIdMap.get(run.threadId) : undefined,
    run_type: run.type,
    status: mapRunStatus(run.status),
    summary: run.summary,
    request_payload: {},
    response_payload: run.payload || {},
    created_at: run.createdAt,
    updated_at: run.createdAt,
  })).filter((row) => row.thread_id);
  if (runRows.length > 0) {
    const { error: runError } = await supabase.from('agent_runs').insert(runRows);
    if (runError) return;
  }

  const suggestionRows = payload.suggestions
    .map((s) => {
      const run = payload.runs.find((r) => r.id === s.runId);
      if (!run?.threadId) return null;
      return {
        id: crypto.randomUUID(),
        run_id: runIdMap.get(s.runId),
        thread_id: threadIdMap.get(run.threadId),
        user_id: user.id,
        description: s.description,
        target: s.target || null,
        replacement: s.replacement || null,
        status: mapSuggestionStatus(s.status),
        confirmation_token: s.confirmationToken || crypto.randomUUID().replaceAll('-', ''),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
  if (suggestionRows.length > 0) {
    const { error: suggestionError } = await supabase.from('agent_suggestions').insert(suggestionRows);
    if (suggestionError) return;
  }

  localStorage.setItem(key, 'true');
}
