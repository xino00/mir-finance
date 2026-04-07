import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!configured) { setLoading(false); return; }

    // PKCE flow: exchange code from URL query params, then get session
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const init = code
      ? supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
          if (error) {
            console.error('[Auth] Code exchange failed:', error.message);
            throw error;
          }
          console.log('[Auth] Code exchanged successfully');
          // Clean the ?code= from the URL without reloading
          window.history.replaceState({}, '', window.location.pathname + window.location.hash);
          return supabase.auth.getSession();
        })
      : supabase.auth.getSession();

    init.then(({ data }) => {
      console.log('[Auth] Session:', data.session ? 'found' : 'none');
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }).catch((err: unknown) => {
      console.error('[Auth] Init error:', err);
      setAuthError(err instanceof Error ? err.message : 'Error al recuperar la sesión');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setAuthError(null);
      const redirectTo = window.location.origin + (import.meta.env.BASE_URL ?? '/');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) setAuthError(error.message);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setAuthError(null);
      const { error } = await supabase.auth.signOut();
      if (error) setAuthError(error.message);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error al cerrar sesión');
    }
  }, []);

  const value = useMemo(() => ({
    user, session, loading, authError, clearAuthError, signInWithGoogle, signOut, isConfigured: configured,
  }), [user, session, loading, authError, clearAuthError, signInWithGoogle, signOut, configured]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
