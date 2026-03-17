-- Brain Flows Supabase schema for auth + per-user storage.
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles(email);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Document',
  content text not null default '',
  export_format text,
  word_count int not null default 0,
  character_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_id_idx on public.documents(user_id);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  widgets jsonb not null default '[]'::jsonb,
  layout jsonb not null default '{}'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  distraction_free_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.openclaw_user_agents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  agent_id text not null unique,
  workspace_path text,
  auth_profile_ref text,
  status text not null default 'disconnected'
    check (status in ('connected', 'disconnected', 'error')),
  provider text not null default 'openclaw',
  key_last4 text,
  connection_error text,
  connected_at timestamptz,
  last_validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists openclaw_user_agents_status_idx
on public.openclaw_user_agents(status);

do $$
begin
  create type public.agent_run_status as enum (
    'queued',
    'running',
    'needs_confirmation',
    'completed',
    'failed',
    'blocked'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.agent_suggestion_status as enum (
    'needs_confirmation',
    'applied',
    'rejected',
    'blocked'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.agent_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  surface text not null default 'agent' check (surface in ('agent', 'widget')),
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_threads_user_id_idx on public.agent_threads(user_id);
create index if not exists agent_threads_user_surface_idx on public.agent_threads(user_id, surface);
create index if not exists agent_threads_user_updated_at_idx on public.agent_threads(user_id, updated_at desc);

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.agent_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_messages_user_id_idx on public.agent_messages(user_id);
create index if not exists agent_messages_thread_created_at_idx on public.agent_messages(thread_id, created_at);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.agent_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  run_type text not null default 'message',
  status public.agent_run_status not null default 'queued',
  summary text,
  error_message text,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_runs_user_id_idx on public.agent_runs(user_id);
create index if not exists agent_runs_thread_created_at_idx on public.agent_runs(thread_id, created_at desc);
create index if not exists agent_runs_user_status_idx on public.agent_runs(user_id, status);

create table if not exists public.agent_suggestions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  thread_id uuid not null references public.agent_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  target jsonb,
  replacement text,
  status public.agent_suggestion_status not null default 'needs_confirmation',
  confirmation_token text not null default encode(gen_random_bytes(16), 'hex'),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_suggestions_user_id_idx on public.agent_suggestions(user_id);
create index if not exists agent_suggestions_thread_status_idx on public.agent_suggestions(thread_id, status);
create index if not exists agent_suggestions_run_id_idx on public.agent_suggestions(run_id);

create table if not exists public.agent_audit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid references public.agent_threads(id) on delete cascade,
  run_id uuid references public.agent_runs(id) on delete cascade,
  suggestion_id uuid references public.agent_suggestions(id) on delete set null,
  action text not null,
  outcome text not null check (outcome in ('allowed', 'blocked', 'error')),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_audit_events_user_id_idx on public.agent_audit_events(user_id);
create index if not exists agent_audit_events_created_at_idx on public.agent_audit_events(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

drop trigger if exists openclaw_user_agents_set_updated_at on public.openclaw_user_agents;
create trigger openclaw_user_agents_set_updated_at
before update on public.openclaw_user_agents
for each row execute function public.set_updated_at();

drop trigger if exists agent_threads_set_updated_at on public.agent_threads;
create trigger agent_threads_set_updated_at
before update on public.agent_threads
for each row execute function public.set_updated_at();

drop trigger if exists agent_runs_set_updated_at on public.agent_runs;
create trigger agent_runs_set_updated_at
before update on public.agent_runs
for each row execute function public.set_updated_at();

drop trigger if exists agent_suggestions_set_updated_at on public.agent_suggestions;
create trigger agent_suggestions_set_updated_at
before update on public.agent_suggestions
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.user_settings enable row level security;
alter table public.openclaw_user_agents enable row level security;
alter table public.agent_threads enable row level security;
alter table public.agent_messages enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_suggestions enable row level security;
alter table public.agent_audit_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own"
on public.documents for select
using (auth.uid() = user_id);

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own"
on public.documents for insert
with check (auth.uid() = user_id);

drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own"
on public.documents for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own"
on public.documents for delete
using (auth.uid() = user_id);

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
on public.user_settings for select
using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
on public.user_settings for insert
with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
on public.user_settings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_delete_own"
on public.user_settings for delete
using (auth.uid() = user_id);

drop policy if exists "openclaw_user_agents_select_own" on public.openclaw_user_agents;
create policy "openclaw_user_agents_select_own"
on public.openclaw_user_agents for select
using (auth.uid() = user_id);

drop policy if exists "openclaw_user_agents_insert_own" on public.openclaw_user_agents;
create policy "openclaw_user_agents_insert_own"
on public.openclaw_user_agents for insert
with check (auth.uid() = user_id);

drop policy if exists "openclaw_user_agents_update_own" on public.openclaw_user_agents;
create policy "openclaw_user_agents_update_own"
on public.openclaw_user_agents for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "openclaw_user_agents_delete_own" on public.openclaw_user_agents;
create policy "openclaw_user_agents_delete_own"
on public.openclaw_user_agents for delete
using (auth.uid() = user_id);

drop policy if exists "agent_threads_select_own" on public.agent_threads;
create policy "agent_threads_select_own"
on public.agent_threads for select
using (auth.uid() = user_id);

drop policy if exists "agent_threads_insert_own" on public.agent_threads;
create policy "agent_threads_insert_own"
on public.agent_threads for insert
with check (auth.uid() = user_id);

drop policy if exists "agent_threads_update_own" on public.agent_threads;
create policy "agent_threads_update_own"
on public.agent_threads for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "agent_threads_delete_own" on public.agent_threads;
create policy "agent_threads_delete_own"
on public.agent_threads for delete
using (auth.uid() = user_id);

drop policy if exists "agent_messages_select_own" on public.agent_messages;
create policy "agent_messages_select_own"
on public.agent_messages for select
using (auth.uid() = user_id);

drop policy if exists "agent_messages_insert_own" on public.agent_messages;
create policy "agent_messages_insert_own"
on public.agent_messages for insert
with check (auth.uid() = user_id);

drop policy if exists "agent_messages_update_own" on public.agent_messages;
create policy "agent_messages_update_own"
on public.agent_messages for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "agent_messages_delete_own" on public.agent_messages;
create policy "agent_messages_delete_own"
on public.agent_messages for delete
using (auth.uid() = user_id);

drop policy if exists "agent_runs_select_own" on public.agent_runs;
create policy "agent_runs_select_own"
on public.agent_runs for select
using (auth.uid() = user_id);

drop policy if exists "agent_runs_insert_own" on public.agent_runs;
create policy "agent_runs_insert_own"
on public.agent_runs for insert
with check (auth.uid() = user_id);

drop policy if exists "agent_runs_update_own" on public.agent_runs;
create policy "agent_runs_update_own"
on public.agent_runs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "agent_runs_delete_own" on public.agent_runs;
create policy "agent_runs_delete_own"
on public.agent_runs for delete
using (auth.uid() = user_id);

drop policy if exists "agent_suggestions_select_own" on public.agent_suggestions;
create policy "agent_suggestions_select_own"
on public.agent_suggestions for select
using (auth.uid() = user_id);

drop policy if exists "agent_suggestions_insert_own" on public.agent_suggestions;
create policy "agent_suggestions_insert_own"
on public.agent_suggestions for insert
with check (auth.uid() = user_id);

drop policy if exists "agent_suggestions_update_own" on public.agent_suggestions;
create policy "agent_suggestions_update_own"
on public.agent_suggestions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "agent_suggestions_delete_own" on public.agent_suggestions;
create policy "agent_suggestions_delete_own"
on public.agent_suggestions for delete
using (auth.uid() = user_id);

drop policy if exists "agent_audit_events_select_own" on public.agent_audit_events;
create policy "agent_audit_events_select_own"
on public.agent_audit_events for select
using (auth.uid() = user_id);

drop policy if exists "agent_audit_events_insert_own" on public.agent_audit_events;
create policy "agent_audit_events_insert_own"
on public.agent_audit_events for insert
with check (auth.uid() = user_id);

create or replace view public.agent_metrics_daily as
select
  user_id,
  date_trunc('day', created_at) as day,
  count(*) filter (where action = 'send_message' and outcome = 'allowed') as allowed_runs,
  count(*) filter (where action = 'send_message' and outcome = 'blocked') as blocked_runs,
  count(*) filter (where action = 'send_message' and outcome = 'error') as failed_runs,
  count(*) as total_events
from public.agent_audit_events
group by user_id, date_trunc('day', created_at);
