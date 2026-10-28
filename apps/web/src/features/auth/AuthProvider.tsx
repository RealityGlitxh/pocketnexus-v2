import type { Session } from '@supabase/supabase-js';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';
import { AuthContext, type AuthState } from './authContext';

function initialState(): AuthState {
  if (env.supabase.status === 'missing') return { status: 'disabled', reason: 'missing' };
  if (env.supabase.status === 'invalid') return { status: 'disabled', reason: 'invalid' };
  return { status: 'loading' };
}

function fromSession(session: Session | null): AuthState {
  if (!session) return { status: 'signed_out' };
  return {
    status: 'signed_in',
    user: { id: session.user.id, email: session.user.email ?? null },
  };
}

/**
 * Owns the auth session for the whole app. Subscribes once to Supabase auth
 * events; components read state via useAuth(). When Supabase is not
 * configured, state is permanently 'disabled' and no SDK code is loaded.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const [recovery, setRecovery] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const clientPromise = getSupabase();
    if (!clientPromise) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void clientPromise
      .then(async (client) => {
        const { data } = client.auth.onAuthStateChange((event, session) => {
          if (cancelled) return;
          if (event === 'PASSWORD_RECOVERY') setRecovery(true);
          if (event === 'SIGNED_OUT') {
            setRecovery(false);
            // Drop any user-scoped cached data immediately on sign-out.
            queryClient.removeQueries({ queryKey: ['user'] });
          }
          setState(fromSession(session));
        });
        unsubscribe = () => {
          data.subscription.unsubscribe();
        };
        const { data: sessionData } = await client.auth.getSession();
        if (!cancelled) setState(fromSession(sessionData.session));
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [queryClient]);

  const value = useMemo(() => ({ state, isPasswordRecovery: recovery }), [state, recovery]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
