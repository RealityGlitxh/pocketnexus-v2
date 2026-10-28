import { createContext, useContext } from 'react';

export interface AuthUser {
  readonly id: string;
  readonly email: string | null;
}

export type AuthState =
  /** Supabase isn't configured for this build; auth UI explains why. */
  | { readonly status: 'disabled'; readonly reason: 'missing' | 'invalid' }
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'signed_out' }
  | { readonly status: 'signed_in'; readonly user: AuthUser };

export interface AuthContextValue {
  readonly state: AuthState;
  /** True after arriving from a password-reset email link. */
  readonly isPasswordRecovery: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}
