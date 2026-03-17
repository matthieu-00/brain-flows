---
name: openclaw-dedicated-agent
description: Implement and maintain OpenClaw integration with dedicated per-user agent/workspace isolation, strict auth.uid routing, and confirmation-gated suggestion guardrails. Use when changing agent gateway logic, agent connection UX, routing, audit events, or OpenClaw-related schema.
---

# OpenClaw Dedicated Agent

## Non-negotiable rules

1. Route every agent operation by authenticated Supabase user id (`auth.uid()`).
2. Never trust client-supplied `agent_id` for routing decisions.
3. Never use global fallback credentials for user traffic.
4. Block send/apply operations when no active dedicated agent mapping exists.
5. Keep suggestion apply confirmation-gated (no auto-apply writes).
6. Persist route/connect/disconnect/blocked outcomes in `agent_audit_events`.

## Required touchpoints

- `docs/supabase/schema.sql`
  - `openclaw_user_agents` registry
  - RLS for strict ownership
- `supabase/functions/agent-gateway/index.ts`
  - user-to-agent mapping resolve
  - lifecycle actions (`connectOpenClawAgent`, `getOpenClawAgentStatus`, `disconnectOpenClawAgent`)
  - blocked behavior on missing mapping
- `src/lib/agentClient.ts`
  - lifecycle API helpers
- `src/components/layout/SettingsModal.tsx`
  - connect/disconnect/status controls
- `src/components/agent/AgentChatModal.tsx`
- `src/components/agent/AgentPanel.tsx`
- `src/components/widgets/AIChatWidget.tsx`
  - hard send blocking when disconnected

## Implementation checklist

- [ ] Mapping table enforces one active mapping per user.
- [ ] Gateway resolves mapping server-side and rejects unconnected users.
- [ ] No secrets stored in localStorage, Zustand persisted state, or browser env.
- [ ] Apply/reject suggestion still requires explicit user action.
- [ ] Audit includes:
  - `agent_route_resolved`
  - `agent_route_blocked`
  - `agent_connected`
  - `agent_disconnected`

## Anti-patterns

- Using `agent_id` from request body as authoritative routing key.
- Returning connected status from frontend local toggle without backend validation.
- Silent fallback to shared/global provider key when user has no mapping.
- Allowing suggestion application without confirmation token flow.
