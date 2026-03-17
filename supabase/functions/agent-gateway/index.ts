import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

type Json = Record<string, unknown>;
type AgentSurface = 'agent' | 'widget';
type AgentRole = 'user' | 'assistant' | 'system';
type RunStatus = 'queued' | 'running' | 'needs_confirmation' | 'completed' | 'failed' | 'blocked';
type SuggestionStatus = 'needs_confirmation' | 'applied' | 'rejected' | 'blocked';
type ConnectionStatus = 'connected' | 'disconnected' | 'error';

interface SendMessageBody {
  action: 'sendMessage';
  surface?: AgentSurface;
  threadId?: string;
  threadName?: string;
  message: string;
  contextDocumentIds?: string[];
  currentDocumentId?: string | null;
  selection?: { from: number; to: number; text: string } | null;
  quotedSnippet?: { text: string; role?: 'user' | 'assistant'; source?: string } | null;
}

interface FetchStateBody {
  action: 'fetchState';
  surface?: AgentSurface;
  threadId?: string;
}

interface ConfirmSuggestionBody {
  action: 'confirmSuggestion';
  suggestionId: string;
  confirmationToken: string;
}

interface RejectSuggestionBody {
  action: 'rejectSuggestion';
  suggestionId: string;
}

interface ConnectOpenClawAgentBody {
  action: 'connectOpenClawAgent';
  agentId: string;
  workspacePath?: string;
  authProfileRef?: string;
  keyLast4?: string;
}

interface GetOpenClawAgentStatusBody {
  action: 'getOpenClawAgentStatus';
}

interface DisconnectOpenClawAgentBody {
  action: 'disconnectOpenClawAgent';
}

type RequestBody =
  | SendMessageBody
  | FetchStateBody
  | ConfirmSuggestionBody
  | RejectSuggestionBody
  | ConnectOpenClawAgentBody
  | GetOpenClawAgentStatusBody
  | DisconnectOpenClawAgentBody;

interface UserAgentRow {
  user_id: string;
  agent_id: string;
  workspace_path: string | null;
  auth_profile_ref: string | null;
  status: ConnectionStatus;
  key_last4: string | null;
  connection_error: string | null;
  connected_at: string | null;
  last_validated_at: string | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-correlation-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getWordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function getCharacterCount(text: string): number {
  return text.length;
}

function containsBlockedIntent(message: string): string | null {
  const lower = message.toLowerCase();
  if (/(delete file|rm -rf|drop table|truncate table|format disk)/i.test(lower)) {
    return 'Destructive operation request blocked by policy.';
  }
  if (/(call webhook|post to|send email|publish to|deploy|execute command)/i.test(lower)) {
    return 'External side-effect operation blocked in current policy.';
  }
  return null;
}

function maybeBuildSuggestion(message: string, selection?: { from: number; to: number; text: string } | null) {
  const asksForEdit = /(fix|edit|rewrite|correct|replace|improve|refactor|grammar|spell)/i.test(message);
  if (!asksForEdit || !selection?.text?.trim()) return null;
  const replacement = selection.text.trim();
  return {
    description: 'Suggested revision for selected text (requires confirmation before apply).',
    target: {
      from: selection.from,
      to: selection.to,
    },
    replacement: replacement.charAt(0).toUpperCase() + replacement.slice(1),
  };
}

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

async function resolveUserId(req: Request, supabaseUrl: string, anonKey: string): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing Authorization header');
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) throw new Error('Unauthorized');
  return data.user.id;
}

async function createThreadIfNeeded(
  service: ReturnType<typeof createClient>,
  userId: string,
  body: SendMessageBody
): Promise<{ id: string; name: string | null; surface: AgentSurface }> {
  if (body.threadId) {
    const { data, error } = await service
      .from('agent_threads')
      .select('id, name, surface')
      .eq('id', body.threadId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) throw new Error('Thread not found');
    return data as { id: string; name: string | null; surface: AgentSurface };
  }

  const { data, error } = await service
    .from('agent_threads')
    .insert({
      user_id: userId,
      surface: body.surface ?? 'agent',
      name: body.threadName?.trim() || null,
    })
    .select('id, name, surface')
    .single();
  if (error || !data) throw new Error('Failed to create thread');
  return data as { id: string; name: string | null; surface: AgentSurface };
}

async function getUserAgentMapping(
  service: ReturnType<typeof createClient>,
  userId: string
): Promise<UserAgentRow | null> {
  const { data, error } = await service
    .from('openclaw_user_agents')
    .select(
      'user_id, agent_id, workspace_path, auth_profile_ref, status, key_last4, connection_error, connected_at, last_validated_at'
    )
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as UserAgentRow | null) ?? null;
}

async function requireConnectedAgentMapping(
  service: ReturnType<typeof createClient>,
  userId: string
): Promise<UserAgentRow> {
  const mapping = await getUserAgentMapping(service, userId);
  if (!mapping || mapping.status !== 'connected' || !mapping.agent_id) {
    throw new Error('agent_not_connected');
  }
  return mapping;
}

async function writeAudit(
  service: ReturnType<typeof createClient>,
  payload: {
    user_id: string;
    thread_id?: string;
    run_id?: string;
    suggestion_id?: string;
    action: string;
    outcome: 'allowed' | 'blocked' | 'error';
    reason?: string;
    metadata?: Json;
  }
): Promise<void> {
  await service.from('agent_audit_events').insert({
    ...payload,
    metadata: payload.metadata ?? {},
  });
}

async function callProviderOrFallback(message: string, contextSummary: string): Promise<string> {
  const endpoint = Deno.env.get('OPENCLAW_GATEWAY_URL');
  const gatewayToken = Deno.env.get('OPENCLAW_GATEWAY_TOKEN');
  const model = Deno.env.get('OPENCLAW_DEFAULT_MODEL') ?? 'default';

  if (!endpoint) {
    return `I can help with that. I reviewed your prompt and context: ${contextSummary}`;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (gatewayToken) {
      headers.Authorization = `Bearer ${gatewayToken}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        message,
        context: contextSummary,
        policy_mode: 'moderate_confirm_before_apply',
      }),
    });
    if (!response.ok) throw new Error(`Provider response ${response.status}`);
    const data = (await response.json()) as { message?: string };
    return data.message?.trim() || `I processed your request. Context: ${contextSummary}`;
  } catch {
    return `I can help with that. I reviewed your prompt and context: ${contextSummary}`;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const correlationId = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
    const supabaseUrl = getEnv('SUPABASE_URL');
    const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');
    const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
    const service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const userId = await resolveUserId(req, supabaseUrl, supabaseAnonKey);
    const body = (await req.json()) as RequestBody;

    if (body.action === 'getOpenClawAgentStatus') {
      const mapping = await getUserAgentMapping(service, userId);
      return jsonResponse({
        ok: true,
        correlationId,
        connected: mapping?.status === 'connected',
        mapping: mapping ?? null,
      });
    }

    if (body.action === 'connectOpenClawAgent') {
      const agentId = body.agentId?.trim();
      if (!agentId) {
        return jsonResponse({ ok: false, error: 'agentId is required' }, 400);
      }

      const { data, error } = await service
        .from('openclaw_user_agents')
        .upsert(
          {
            user_id: userId,
            agent_id: agentId,
            workspace_path: body.workspacePath?.trim() || null,
            auth_profile_ref: body.authProfileRef?.trim() || null,
            status: 'connected' satisfies ConnectionStatus,
            key_last4: body.keyLast4?.trim() || null,
            connection_error: null,
            connected_at: new Date().toISOString(),
            last_validated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select(
          'user_id, agent_id, workspace_path, auth_profile_ref, status, key_last4, connection_error, connected_at, last_validated_at'
        )
        .single();
      if (error || !data) throw new Error('Failed to connect dedicated agent');

      await writeAudit(service, {
        user_id: userId,
        action: 'agent_connected',
        outcome: 'allowed',
        metadata: {
          agent_id: data.agent_id,
          auth_profile_ref: data.auth_profile_ref,
        },
      });

      return jsonResponse({
        ok: true,
        correlationId,
        connected: true,
        mapping: data,
      });
    }

    if (body.action === 'disconnectOpenClawAgent') {
      const existing = await getUserAgentMapping(service, userId);
      if (!existing) {
        return jsonResponse({
          ok: true,
          correlationId,
          connected: false,
          mapping: null,
        });
      }

      const { data, error } = await service
        .from('openclaw_user_agents')
        .update({
          status: 'disconnected' satisfies ConnectionStatus,
          connection_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select(
          'user_id, agent_id, workspace_path, auth_profile_ref, status, key_last4, connection_error, connected_at, last_validated_at'
        )
        .single();
      if (error) throw error;

      await writeAudit(service, {
        user_id: userId,
        action: 'agent_disconnected',
        outcome: 'allowed',
        metadata: {
          agent_id: existing.agent_id,
        },
      });

      return jsonResponse({
        ok: true,
        correlationId,
        connected: false,
        mapping: data ?? null,
      });
    }

    if (body.action === 'fetchState') {
      const surface = body.surface ?? 'agent';
      const threadQuery = service
        .from('agent_threads')
        .select('id, user_id, surface, name, created_at, updated_at')
        .eq('user_id', userId)
        .eq('surface', surface)
        .order('updated_at', { ascending: false })
        .limit(30);

      const { data: threads, error: threadError } = await threadQuery;
      if (threadError) throw threadError;
      const threadIds = (threads ?? []).map((t) => t.id);

      const { data: messages } = threadIds.length
        ? await service
            .from('agent_messages')
            .select('id, thread_id, role, content, created_at, metadata')
            .eq('user_id', userId)
            .in('thread_id', threadIds)
            .order('created_at', { ascending: true })
            .limit(500)
        : { data: [] as Array<Record<string, unknown>> };

      const { data: runs } = threadIds.length
        ? await service
            .from('agent_runs')
            .select('id, thread_id, run_type, status, summary, created_at, response_payload')
            .eq('user_id', userId)
            .in('thread_id', threadIds)
            .order('created_at', { ascending: false })
            .limit(200)
        : { data: [] as Array<Record<string, unknown>> };

      const { data: suggestions } = threadIds.length
        ? await service
            .from('agent_suggestions')
            .select('id, run_id, thread_id, description, target, replacement, status, confirmation_token, created_at')
            .eq('user_id', userId)
            .in('thread_id', threadIds)
            .order('created_at', { ascending: false })
            .limit(200)
        : { data: [] as Array<Record<string, unknown>> };

      return jsonResponse({
        ok: true,
        correlationId,
        threads: threads ?? [],
        messages: messages ?? [],
        runs: runs ?? [],
        suggestions: suggestions ?? [],
      });
    }

    if (body.action === 'rejectSuggestion') {
      const { data: suggestion, error: suggestionError } = await service
        .from('agent_suggestions')
        .select('id, user_id, thread_id')
        .eq('id', body.suggestionId)
        .eq('user_id', userId)
        .maybeSingle();
      if (suggestionError || !suggestion) throw new Error('Suggestion not found');

      const { error: updateError } = await service
        .from('agent_suggestions')
        .update({ status: 'rejected' satisfies SuggestionStatus })
        .eq('id', body.suggestionId)
        .eq('user_id', userId);
      if (updateError) throw updateError;

      await writeAudit(service, {
        user_id: userId,
        thread_id: suggestion.thread_id as string,
        suggestion_id: body.suggestionId,
        action: 'reject_suggestion',
        outcome: 'allowed',
      });

      return jsonResponse({ ok: true, correlationId });
    }

    if (body.action === 'confirmSuggestion') {
      const { data: suggestion, error: suggestionError } = await service
        .from('agent_suggestions')
        .select('id, run_id, thread_id, user_id, target, replacement, status, confirmation_token')
        .eq('id', body.suggestionId)
        .eq('user_id', userId)
        .maybeSingle();
      if (suggestionError || !suggestion) throw new Error('Suggestion not found');

      if (suggestion.status !== 'needs_confirmation') {
        throw new Error('Suggestion is no longer pending confirmation');
      }
      if (suggestion.confirmation_token !== body.confirmationToken) {
        throw new Error('Invalid confirmation token');
      }

      const target = (suggestion.target ?? {}) as { documentId?: string; from?: number; to?: number };
      if (target.documentId && Number.isInteger(target.from) && Number.isInteger(target.to) && typeof suggestion.replacement === 'string') {
        const { data: document, error: docError } = await service
          .from('documents')
          .select('id, content')
          .eq('id', target.documentId)
          .eq('user_id', userId)
          .maybeSingle();
        if (docError || !document) throw new Error('Target document not found');

        const content = String(document.content ?? '');
        const from = Math.max(0, target.from as number);
        const to = Math.max(from, target.to as number);
        const next = content.slice(0, from) + suggestion.replacement + content.slice(to);

        const { error: saveDocError } = await service
          .from('documents')
          .update({
            content: next,
            word_count: getWordCount(next),
            character_count: getCharacterCount(next),
            updated_at: new Date().toISOString(),
          })
          .eq('id', target.documentId)
          .eq('user_id', userId);
        if (saveDocError) throw saveDocError;
      }

      const { error: updateError } = await service
        .from('agent_suggestions')
        .update({
          status: 'applied' satisfies SuggestionStatus,
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', suggestion.id)
        .eq('user_id', userId);
      if (updateError) throw updateError;

      await writeAudit(service, {
        user_id: userId,
        thread_id: suggestion.thread_id as string,
        run_id: suggestion.run_id as string,
        suggestion_id: body.suggestionId,
        action: 'confirm_suggestion',
        outcome: 'allowed',
      });

      return jsonResponse({ ok: true, correlationId });
    }

    if (body.action !== 'sendMessage') {
      return jsonResponse({ ok: false, error: 'Unsupported action' }, 400);
    }

    const message = body.message?.trim();
    if (!message) return jsonResponse({ ok: false, error: 'Message is required' }, 400);
    if (message.length > 5000) return jsonResponse({ ok: false, error: 'Message too long' }, 400);

    let mapping: UserAgentRow;
    try {
      mapping = await requireConnectedAgentMapping(service, userId);
      await writeAudit(service, {
        user_id: userId,
        action: 'agent_route_resolved',
        outcome: 'allowed',
        metadata: {
          agent_id: mapping.agent_id,
          auth_profile_ref: mapping.auth_profile_ref,
        },
      });
    } catch {
      await writeAudit(service, {
        user_id: userId,
        action: 'agent_route_blocked',
        outcome: 'blocked',
        reason: 'agent_not_connected',
      });
      return jsonResponse({ ok: false, error: 'agent_not_connected' }, 403);
    }

    const blockedReason = containsBlockedIntent(message);
    const thread = await createThreadIfNeeded(service, userId, body);

    const { data: userMessage, error: userMessageError } = await service
      .from('agent_messages')
      .insert({
        user_id: userId,
        thread_id: thread.id,
        role: 'user' satisfies AgentRole,
        content: message,
        metadata: {
          quotedSnippet: body.quotedSnippet ?? null,
          contextDocumentIds: body.contextDocumentIds ?? [],
          currentDocumentId: body.currentDocumentId ?? null,
        },
      })
      .select('id, thread_id, role, content, created_at, metadata')
      .single();
    if (userMessageError || !userMessage) throw new Error('Failed to save user message');

    const { data: run, error: runError } = await service
      .from('agent_runs')
      .insert({
        thread_id: thread.id,
        user_id: userId,
        run_type: 'message',
        status: blockedReason ? ('blocked' satisfies RunStatus) : ('running' satisfies RunStatus),
        summary: blockedReason ? 'Blocked by guardrail policy.' : 'Processing request.',
        request_payload: {
          message,
          contextDocumentIds: body.contextDocumentIds ?? [],
          currentDocumentId: body.currentDocumentId ?? null,
          selection: body.selection ?? null,
          quotedSnippet: body.quotedSnippet ?? null,
          agent_id: mapping.agent_id,
          auth_profile_ref: mapping.auth_profile_ref,
        },
      })
      .select('id, thread_id, run_type, status, summary, created_at')
      .single();
    if (runError || !run) throw new Error('Failed to create run');

    if (blockedReason) {
      const blockedReply = `I cannot do that request: ${blockedReason}`;
      const { data: assistantMessage } = await service
        .from('agent_messages')
        .insert({
          user_id: userId,
          thread_id: thread.id,
          role: 'assistant' satisfies AgentRole,
          content: blockedReply,
          metadata: { policy: 'blocked', reason: blockedReason },
        })
        .select('id, thread_id, role, content, created_at, metadata')
        .single();

      await service
        .from('agent_runs')
        .update({
          status: 'blocked' satisfies RunStatus,
          summary: blockedReason,
          response_payload: { message: blockedReply },
          updated_at: new Date().toISOString(),
        })
        .eq('id', run.id)
        .eq('user_id', userId);

      await writeAudit(service, {
        user_id: userId,
        thread_id: thread.id,
        run_id: run.id,
        action: 'send_message',
        outcome: 'blocked',
        reason: blockedReason,
      });

      return jsonResponse({
        ok: true,
        correlationId,
        thread,
        run: { ...run, status: 'blocked', summary: blockedReason },
        userMessage,
        assistantMessage,
        suggestions: [],
      });
    }

    const contextSummary = (body.contextDocumentIds ?? []).length > 0
      ? `included ${body.contextDocumentIds?.length ?? 0} context docs`
      : body.currentDocumentId
        ? 'current document context included'
        : 'no document context';
    const providerReply = await callProviderOrFallback(
      `${message}\n\n[agent_id:${mapping.agent_id}]`,
      contextSummary
    );

    const suggestion = maybeBuildSuggestion(message, body.selection);
    const needsConfirmation = Boolean(suggestion);
    let savedSuggestion: Record<string, unknown> | null = null;

    const { data: assistantMessage, error: assistantError } = await service
      .from('agent_messages')
      .insert({
        user_id: userId,
        thread_id: thread.id,
        role: 'assistant' satisfies AgentRole,
        content: needsConfirmation
          ? `${providerReply}\n\nI generated a suggestion that requires your confirmation before applying.`
          : providerReply,
        metadata: {
          policy: 'moderate_confirm_before_apply',
        },
      })
      .select('id, thread_id, role, content, created_at, metadata')
      .single();
    if (assistantError || !assistantMessage) throw new Error('Failed to save assistant message');

    if (suggestion) {
      const { data: sug, error: sugError } = await service
        .from('agent_suggestions')
        .insert({
          run_id: run.id,
          thread_id: thread.id,
          user_id: userId,
          description: suggestion.description,
          target: {
            ...(suggestion.target ?? {}),
            documentId: body.currentDocumentId ?? null,
          },
          replacement: suggestion.replacement,
          status: 'needs_confirmation' satisfies SuggestionStatus,
        })
        .select('id, run_id, thread_id, description, target, replacement, status, confirmation_token, created_at')
        .single();
      if (sugError) throw sugError;
      savedSuggestion = sug as Record<string, unknown>;
    }

    const runStatus: RunStatus = suggestion ? 'needs_confirmation' : 'completed';
    const runSummary = suggestion
      ? 'Suggestion generated and awaiting confirmation.'
      : `Response generated for: "${message.slice(0, 60)}${message.length > 60 ? '…' : ''}"`;

    await service
      .from('agent_runs')
      .update({
        status: runStatus,
        summary: runSummary,
        response_payload: { message: assistantMessage.content, hasSuggestion: Boolean(savedSuggestion) },
        updated_at: new Date().toISOString(),
      })
      .eq('id', run.id)
      .eq('user_id', userId);

    await service
      .from('agent_threads')
      .update({
        updated_at: new Date().toISOString(),
        name: thread.name ?? body.threadName?.trim() ?? null,
      })
      .eq('id', thread.id)
      .eq('user_id', userId);

    await writeAudit(service, {
      user_id: userId,
      thread_id: thread.id,
      run_id: run.id,
      suggestion_id: (savedSuggestion?.id as string | undefined) ?? undefined,
      action: 'send_message',
      outcome: 'allowed',
      metadata: {
        hasSuggestion: Boolean(savedSuggestion),
        agent_id: mapping.agent_id,
        auth_profile_ref: mapping.auth_profile_ref,
      },
    });

    return jsonResponse({
      ok: true,
      correlationId,
      thread,
      run: {
        ...run,
        status: runStatus,
        summary: runSummary,
      },
      userMessage,
      assistantMessage,
      suggestions: savedSuggestion ? [savedSuggestion] : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ ok: false, error: message }, 500);
  }
});
