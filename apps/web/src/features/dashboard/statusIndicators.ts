import type { AuthState } from '@/features/auth';

export type CheckStatus = 'ok' | 'pending' | 'failed' | 'skipped';

export interface Indicator {
  readonly status: CheckStatus;
  readonly label: 'Configured' | 'Reachable' | 'Authenticated';
  readonly detail: string;
}

export type HealthInput =
  | { readonly status: 'pending' }
  | { readonly status: 'ok'; readonly latencyMs: number }
  | { readonly status: 'failed'; readonly message: string }
  | null;

/**
 * Derives three independent indicators. They are deliberately separate:
 * a build can be configured but unreachable, or reachable while signed out.
 */
export function deriveIndicators(input: {
  configStatus: 'configured' | 'missing' | 'invalid';
  health: HealthInput;
  auth: AuthState;
}): readonly [Indicator, Indicator, Indicator] {
  const { configStatus, health, auth } = input;

  const configured: Indicator =
    configStatus === 'configured'
      ? { status: 'ok', label: 'Configured', detail: 'Supabase URL and publishable key are set' }
      : configStatus === 'invalid'
        ? { status: 'failed', label: 'Configured', detail: 'Configuration is invalid — accounts disabled' }
        : { status: 'failed', label: 'Configured', detail: 'No backend configured for this build' };

  let reachable: Indicator;
  if (configStatus !== 'configured' || health === null) {
    reachable = { status: 'skipped', label: 'Reachable', detail: 'Skipped — no backend configured' };
  } else if (health.status === 'pending') {
    reachable = { status: 'pending', label: 'Reachable', detail: 'Contacting the auth service…' };
  } else if (health.status === 'ok') {
    reachable = { status: 'ok', label: 'Reachable', detail: `Auth service responded in ${health.latencyMs} ms` };
  } else {
    reachable = { status: 'failed', label: 'Reachable', detail: health.message };
  }

  let authenticated: Indicator;
  switch (auth.status) {
    case 'disabled':
      authenticated = { status: 'skipped', label: 'Authenticated', detail: 'Accounts unavailable in this build' };
      break;
    case 'loading':
      authenticated = { status: 'pending', label: 'Authenticated', detail: 'Checking your session…' };
      break;
    case 'error':
      authenticated = { status: 'failed', label: 'Authenticated', detail: 'Could not check your session' };
      break;
    case 'signed_out':
      authenticated = { status: 'skipped', label: 'Authenticated', detail: 'Not signed in' };
      break;
    case 'signed_in':
      authenticated = { status: 'ok', label: 'Authenticated', detail: 'Signed in with a valid session' };
      break;
  }

  return [configured, reachable, authenticated];
}
