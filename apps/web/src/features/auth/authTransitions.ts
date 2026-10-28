import type { AuthState } from './authContext';

/** The subset of a Supabase session the app relies on. */
export interface SessionLike {
  readonly user: { readonly id: string; readonly email?: string | undefined };
}

export const userIdOf = (state: AuthState): string | null =>
  state.status === 'signed_in' ? state.user.id : null;

/**
 * Computes the next auth state from a session. Returns `prev` unchanged when
 * the identity is the same (e.g. TOKEN_REFRESHED), so the context value stays
 * referentially stable and the tree doesn't re-render every token refresh.
 */
export function nextAuthState(prev: AuthState, session: SessionLike | null): AuthState {
  if (!session) return prev.status === 'signed_out' ? prev : { status: 'signed_out' };
  const email = session.user.email ?? null;
  if (prev.status === 'signed_in' && prev.user.id === session.user.id && prev.user.email === email) {
    return prev;
  }
  return { status: 'signed_in', user: { id: session.user.id, email } };
}

/**
 * True when user-scoped cached data must be purged: the signed-in identity
 * changed (sign-out, or a different account signed in — e.g. from another
 * tab — possibly without an intervening SIGNED_OUT event).
 */
export function identityChanged(prev: AuthState, next: AuthState): boolean {
  const before = userIdOf(prev);
  return before !== null && before !== userIdOf(next);
}
