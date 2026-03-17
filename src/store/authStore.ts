import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { requireSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { User } from '../types';

type AuthProvider = 'google' | 'github';

interface ProfileRow {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithProvider: (provider: AuthProvider) => Promise<void>;
  initSession: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

let hasAuthListener = false;

function mapSupabaseUser(authUser: SupabaseUser, profile: ProfileRow | null): User {
  const metadata = authUser.user_metadata as Record<string, unknown> | undefined;
  const metadataName =
    typeof metadata?.name === 'string'
      ? metadata.name
      : typeof metadata?.full_name === 'string'
        ? metadata.full_name
        : null;
  const metadataAvatar =
    typeof metadata?.avatar_url === 'string' ? metadata.avatar_url : undefined;
  const fallbackName = authUser.email?.split('@')[0] ?? 'User';

  return {
    id: authUser.id,
    email: profile?.email ?? authUser.email ?? '',
    name: profile?.name ?? metadataName ?? fallbackName,
    avatar: profile?.avatar_url ?? metadataAvatar,
  };
}

async function upsertProfile(authUser: SupabaseUser, nameOverride?: string) {
  const supabase = requireSupabase();
  const metadata = authUser.user_metadata as Record<string, unknown> | undefined;
  const metadataName =
    typeof metadata?.name === 'string'
      ? metadata.name
      : typeof metadata?.full_name === 'string'
        ? metadata.full_name
        : null;
  const metadataAvatar =
    typeof metadata?.avatar_url === 'string' ? metadata.avatar_url : null;

  const payload = {
    id: authUser.id,
    email: authUser.email ?? null,
    name: nameOverride ?? metadataName ?? authUser.email?.split('@')[0] ?? 'User',
    avatar_url: metadataAvatar,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('profiles').upsert(payload);
  if (error) throw error;
}

async function fetchProfile(authUser: SupabaseUser): Promise<ProfileRow | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, avatar_url')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const supabase = requireSupabase();
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (!data.user) throw new Error('Sign-in did not return a user session.');

          await upsertProfile(data.user);
          const profile = await fetchProfile(data.user);
          const user = mapSupabaseUser(data.user, profile);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true });
        try {
          const supabase = requireSupabase();
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name },
            },
          });
          if (error) throw error;
          if (!data.user) throw new Error('Sign-up failed. Please try again.');

          await upsertProfile(data.user, name);
          const profile = await fetchProfile(data.user);
          const user = mapSupabaseUser(data.user, profile);
          const hasSession = Boolean(data.session);

          set({
            user: hasSession ? user : null,
            isAuthenticated: hasSession,
            isLoading: false,
            isInitialized: true,
          });

          if (!hasSession) {
            throw new Error('Check your email to confirm your account, then sign in.');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithProvider: async (provider: AuthProvider) => {
        set({ isLoading: true });
        try {
          const supabase = requireSupabase();
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: `${window.location.origin}/`,
            },
          });
          if (error) throw error;
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      initSession: async () => {
        if (get().isInitialized) return;
        if (!isSupabaseConfigured) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
          return;
        }

        set({ isLoading: true });

        try {
          const supabase = requireSupabase();
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;

          const authUser = data.session?.user ?? null;
          if (!authUser) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
            });
          } else {
            await upsertProfile(authUser);
            const profile = await fetchProfile(authUser);
            const user = mapSupabaseUser(authUser, profile);

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
            });
          }

          if (!hasAuthListener) {
            hasAuthListener = true;
            supabase.auth.onAuthStateChange(async (_event, session) => {
              const sessionUser = session?.user ?? null;
              if (!sessionUser) {
                set({
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                  isInitialized: true,
                });
                return;
              }

              try {
                await upsertProfile(sessionUser);
                const profile = await fetchProfile(sessionUser);
                const user = mapSupabaseUser(sessionUser, profile);
                set({
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                  isInitialized: true,
                });
              } catch {
                set({ isLoading: false, isInitialized: true });
              }
            });
          }
        } catch {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      logout: async () => {
        try {
          if (isSupabaseConfigured) {
            const supabase = requireSupabase();
            await supabase.auth.signOut();
          }
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateProfile: async (updates: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        if (isSupabaseConfigured) {
          const supabase = requireSupabase();
          const { error } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: updates.email ?? user.email,
              name: updates.name ?? user.name,
              avatar_url: updates.avatar ?? user.avatar ?? null,
              updated_at: new Date().toISOString(),
            });
          if (error) throw error;
        }

        set({
          user: { ...user, ...updates },
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isInitialized: state.isInitialized,
      }),
    }
  )
);