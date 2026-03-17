/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_AGENT_FUNCTION_NAME?: string;
  readonly VITE_AGENT_BACKEND_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
