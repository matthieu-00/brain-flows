# OpenClaw Dedicated Agent Runbook

## Purpose

Operate the dedicated-per-user OpenClaw mapping safely and consistently.

## Data model

- Registry table: `public.openclaw_user_agents`
- Key fields:
  - `user_id`
  - `agent_id`
  - `workspace_path`
  - `auth_profile_ref`
  - `status` (`connected`, `disconnected`, `error`)

## Provisioning flow

1. Ensure the OpenClaw host has the user's provider credentials/profile configured.
2. In app Settings -> Agents, set:
   - Dedicated agent ID
   - Optional auth profile ref
   - Optional workspace path
3. Click Connect agent (gateway stores mapping row for the authenticated user).
4. Verify status is Connected.

## Rotation flow

1. Rotate credentials/profile on OpenClaw host for the dedicated agent.
2. Update `auth_profile_ref` in Settings if needed.
3. Reconnect to refresh mapping metadata.
4. Verify model health on OpenClaw host and confirm app send works.

## Disconnect flow

1. Click Disconnect in Settings -> Agents.
2. Verify app blocks sends with a connect prompt.
3. Confirm audit entry `agent_disconnected`.

## Recovery scenarios

### Missing mapping

- Symptom: send fails with `agent_not_connected`.
- Action: reconnect dedicated agent in Settings.

### Wrong mapping

- Symptom: unexpected agent context.
- Action:
  1. Disconnect mapping.
  2. Reconnect with correct `agent_id`.
  3. Validate with a smoke-test prompt.

### Gateway unavailable

- Symptom: connection status error or request failures.
- Action:
  1. Check Edge Function logs.
  2. Check OpenClaw gateway availability.
  3. Verify `OPENCLAW_GATEWAY_URL` and `OPENCLAW_GATEWAY_TOKEN`.

## Required audits

- `agent_connected`
- `agent_disconnected`
- `agent_route_resolved`
- `agent_route_blocked`
- `send_message` with outcome details

## Security notes

- Do not store provider secrets in client-side state.
- Do not trust client-provided agent identifiers for routing.
- Route by `auth.uid()` -> server-side mapping only.
