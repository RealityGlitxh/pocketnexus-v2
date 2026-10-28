/**
 * A typed success/failure value. Service functions return this instead of
 * throwing so callers must handle failure explicitly, and so error messages
 * shown to users are always safe, pre-written strings.
 */
export type Result<T, E extends AppError = AppError> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export type AppErrorCode =
  | 'not_configured'
  | 'invalid_input'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'network'
  | 'unknown';

export interface AppError {
  readonly code: AppErrorCode;
  /** Safe to display to end users. Never contains raw server output. */
  readonly message: string;
}

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E extends AppError>(error: E): Result<never, E> => ({ ok: false, error });

const SAFE_MESSAGES: Record<AppErrorCode, string> = {
  not_configured: 'This feature is not configured in this environment yet.',
  invalid_input: 'Some of the information entered is not valid.',
  unauthenticated: 'Please sign in to continue.',
  forbidden: 'You do not have permission to do that.',
  not_found: 'We could not find what you were looking for.',
  conflict: 'That conflicts with existing data.',
  rate_limited: 'Too many attempts. Please wait a moment and try again.',
  network: 'We could not reach the server. Check your connection and try again.',
  unknown: 'Something went wrong. Please try again.',
};

export const appError = (code: AppErrorCode, message?: string): AppError => ({
  code,
  message: message ?? SAFE_MESSAGES[code],
});
