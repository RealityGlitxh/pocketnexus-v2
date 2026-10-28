import { appError, err, ok, type Result } from '@pocketnexus/shared';
import { env } from '@/lib/env';

export interface BackendHealth {
  readonly latencyMs: number;
}

const TIMEOUT_MS = 5000;

/**
 * Checks that the configured Supabase Auth service is reachable by calling its
 * public health endpoint. Uses plain fetch so the dashboard does not have to
 * download the Supabase SDK just to show a status light.
 *
 * Reachable ≠ authenticated: this only proves the network path and API key
 * header are accepted.
 */
export async function checkBackendHealth(
  fetchImpl: typeof fetch = fetch,
): Promise<Result<BackendHealth>> {
  if (env.supabase.status !== 'configured') return err(appError('not_configured'));

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);
  const started = performance.now();
  try {
    const res = await fetchImpl(new URL('/auth/v1/health', env.supabase.url), {
      headers: { apikey: env.supabase.publishableKey },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      return err(appError('network', `The backend responded with an error (HTTP ${res.status}).`));
    }
    return ok({ latencyMs: Math.round(performance.now() - started) });
  } catch {
    return err(
      appError(
        'network',
        controller.signal.aborted
          ? 'The backend did not respond within 5 seconds.'
          : 'The backend could not be reached.',
      ),
    );
  } finally {
    clearTimeout(timer);
  }
}
