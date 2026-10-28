import type { Database } from '@pocketnexus/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

export type PocketNexusClient = SupabaseClient<Database>;

let clientPromise: Promise<PocketNexusClient> | null = null;

/**
 * Lazily loads supabase-js and creates the singleton client.
 *
 * The SDK is ~50 kB gzipped, so it is code-split and only fetched once
 * something actually needs the backend. Returns null when Supabase is not
 * configured for this environment.
 */
export function getSupabase(): Promise<PocketNexusClient> | null {
  if (env.supabase.status !== 'configured') return null;
  const { url, publishableKey } = env.supabase;
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient<Database>(url, publishableKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'pn.auth',
      },
      global: { headers: { 'x-client-info': 'pocketnexus-web' } },
    }),
  );
  return clientPromise;
}

/** Test-only: reset the memoised client. */
export function __resetSupabaseForTests(): void {
  clientPromise = null;
}
