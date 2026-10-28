import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { env } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';
import { AuthContext, type AuthState } from './authContext';
import { identityChanged, nextAuthState, type SessionLike } from './authTransitions';

function initialState(): AuthState {
  if (env.supabase.status === 'missing') return { status: 'disabled', reason: 'missing' };
  if (env.supabase.status === 'invalid') return { status: 'disabled', reason: 'invalid' };
  return { status: 'loading' };
}

/**
 * Owns the auth session for the whole app. Subscribes once to Supabase auth
 * events; components read state via useAuth(). When Supabase is not
 * configured, state is permanently 'disabled' and no SDK code is loaded.
 *
 * Cache isolation: all user-scoped query keys start with ['user', …] and are
 * removed whenever the signed-in identity changes (sign-out, or a different
 * account appearing via another tab), never only on SIGNED_OUT.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const [recovery, setRecovery] = useState(false);
  const queryClient = useQueryClient();
  const stateRef = useRef(state);

  useEffect(() => {
    const clientPromise = getSupabase();
    if (!clientPromise) return;
    const lifecycle = { cancelled: false };
    let unsubscribe: (() => void) | undefined;

    const apply = (session: SessionLike | null) => {
      const prev = stateRef.current;
      const next = nextAuthState(prev, session);
      if (identityChanged(prev, next)) {
        queryClient.removeQueries({ queryKey: ['user'] });
      }
      stateRef.current = next;
      setState(next);
    };

    clientPromise
      .then(async (client) => {
        // Effect may have been cleaned up while the SDK chunk was loading
        // (StrictMode double-invoke, fast unmount): don't leak a subscription.
        if (lifecycle.cancelled) return;
        const { data } = client.auth.onAuthStateChange((event, session) => {
          if (lifecycle.cancelled) return;
          if (event === 'PASSWORD_RECOVERY') setRecovery(true);
          if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') setRecovery(false);
          apply(session);
        });
        unsubscribe = () => {
          data.subscription.unsubscribe();
        };
        const { data: sessionData } = await client.auth.getSession();
        if (!lifecycle.cancelled) apply(sessionData.session);
      })
      .catch(() => {
        // SDK chunk failed to load or the client threw during init.
        if (!lifecycle.cancelled) {
          stateRef.current = { status: 'error' };
          setState(stateRef.current);
        }
      });

    return () => {
      lifecycle.cancelled = true;
      unsubscribe?.();
    };
  }, [queryClient]);

  const value = useMemo(() => ({ state, isPasswordRecovery: recovery }), [state, recovery]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
