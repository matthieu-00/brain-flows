# Brain Flows

A modular writing workspace platform with integrated study tools, widgets, and AI assistance.

## Features

- **Rich text editor** - TipTap-based document editing
- **Widgets** - Flashcards, sticky notes, chess, sudoku, drawing canvas, AI chat, timer, calculator, weather, fidget tools
- **Resizable layout** - Dynamic panels with react-resizable-panels
- **Keyboard shortcuts** - Alt +/- for widgets, Ctrl+S save, Ctrl+E export
- **Distraction-free mode** - Focus on writing

## Getting Started

```bash
npm install
npm run dev
```

### Supabase Setup

1. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. In Supabase, enable auth providers:
   - Email/password
   - Google OAuth
   - GitHub OAuth
3. Run [`docs/supabase/schema.sql`](docs/supabase/schema.sql) in the Supabase SQL editor.
4. Deploy the agent gateway function:
   - `supabase functions deploy agent-gateway`
5. Set function secrets in Supabase (Project Settings -> Edge Functions -> Secrets):
   - `OPENCLAW_GATEWAY_URL`
   - `OPENCLAW_GATEWAY_TOKEN` (optional, if your gateway requires auth)
   - `OPENCLAW_DEFAULT_MODEL` (optional)

### AI Agent Guardrails

- The app sends AI requests through Supabase Edge Functions (`agent-gateway`), not directly from the browser.
- Each authenticated app user must be mapped to a dedicated OpenClaw agent/workspace (`openclaw_user_agents`), and requests are blocked when no active mapping exists.
- Suggestions are stored server-side and require explicit confirmation before apply.
- Guardrails block destructive or external side-effect requests in the default policy mode.
- Routing and lifecycle events are audited (`agent_route_resolved`, `agent_route_blocked`, `agent_connected`, `agent_disconnected`).

### Dedicated-Agent Operations

- See [`docs/openclaw-dedicated-agent-runbook.md`](docs/openclaw-dedicated-agent-runbook.md) for provisioning, recovery, rotation, and troubleshooting.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
