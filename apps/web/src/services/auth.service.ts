import {
  appError,
  err,
  ok,
  passwordResetRequestSchema,
  passwordUpdateSchema,
  signInSchema,
  signUpSchema,
  type AppError,
  type PasswordResetRequestInput,
  type PasswordUpdateInput,
  type Result,
  type SignInInput,
  type SignUpInput,
} from '@pocketnexus/shared';
import type { AuthError, Session } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';

/**
 * Thin, typed wrapper around Supabase Auth.
 *  - Validates input with shared zod schemas before any network call.
 *  - Never surfaces raw server messages; maps error codes to safe copy.
 *  - Avoids account enumeration (sign-up and reset always look the same).
 */

const notConfigured = () =>
  err(
    appError(
      'not_configured',
      'Accounts are not available in this environment yet. The development backend has not been connected.',
    ),
  );

function mapAuthError(error: AuthError): AppError {
  switch (error.code) {
    case 'invalid_credentials':
      return appError('unauthenticated', 'Email or password is incorrect.');
    case 'email_not_confirmed':
      return appError('unauthenticated', 'Please confirm your email address before signing in.');
    case 'weak_password':
      return appError('invalid_input', 'That password is too weak. Try a longer one.');
    case 'same_password':
      return appError('invalid_input', 'Choose a password you have not used before.');
    case 'reauthentication_needed':
    case 'reauthentication_not_valid':
      return appError(
        'unauthenticated',
        'For your security, request a password reset email and use that link to set a new password.',
      );
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return appError('rate_limited');
    case 'session_not_found':
    case 'session_expired':
    case 'refresh_token_not_found':
      return appError('unauthenticated', 'Your session has expired. Please sign in again.');
    default:
      if (error.name === 'AuthRetryableFetchError') return appError('network');
      return appError('unknown');
  }
}

function invalid(message: string | undefined): Result<never> {
  return err(appError('invalid_input', message));
}

const redirectUrl = (path: string) =>
  new URL(path, env.siteUrl ?? window.location.origin).toString();

export async function signIn(input: SignInInput): Promise<Result<Session>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const client = getSupabase();
  if (!client) return notConfigured();
  const { data, error } = await (await client).auth.signInWithPassword(parsed.data);
  if (error) return err(mapAuthError(error));
  return ok(data.session);
}

export async function signUp(input: SignUpInput): Promise<Result<{ needsConfirmation: boolean }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const client = getSupabase();
  if (!client) return notConfigured();
  const { email, password, username } = parsed.data;
  const { data, error } = await (await client).auth.signUp({
    email,
    password,
    options: {
      // Read by public.handle_new_user() to initialise the profile.
      data: { username },
      emailRedirectTo: redirectUrl('/'),
    },
  });
  if (error) {
    // Do not reveal whether the address is already registered.
    if (error.code === 'user_already_exists' || error.code === 'email_exists') {
      return ok({ needsConfirmation: true });
    }
    return err(mapAuthError(error));
  }
  return ok({ needsConfirmation: data.session === null });
}

export async function signOut(): Promise<Result<null>> {
  const client = getSupabase();
  if (!client) return notConfigured();
  const { error } = await (await client).auth.signOut({ scope: 'local' });
  if (error) return err(mapAuthError(error));
  return ok(null);
}

export async function requestPasswordReset(
  input: PasswordResetRequestInput,
): Promise<Result<null>> {
  const parsed = passwordResetRequestSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const client = getSupabase();
  if (!client) return notConfigured();
  const { error } = await (await client).auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: redirectUrl('/auth/update-password'),
  });
  // Rate limiting is the only error worth surfacing; everything else looks
  // like success so the form can't be used to probe for accounts.
  if (error && (error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit')) {
    return err(appError('rate_limited'));
  }
  return ok(null);
}

export async function updatePassword(input: PasswordUpdateInput): Promise<Result<null>> {
  const parsed = passwordUpdateSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const client = getSupabase();
  if (!client) return notConfigured();
  const { error } = await (await client).auth.updateUser({ password: parsed.data.password });
  if (error) return err(mapAuthError(error));
  return ok(null);
}
