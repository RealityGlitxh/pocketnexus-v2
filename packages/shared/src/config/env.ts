import { z } from 'zod';
import { APP_ENVIRONMENTS } from '../constants';

/**
 * Supabase project refs that must never be used by V2 builds.
 * cdmzrsvwztndqfwzsumo = legacy V8 production (beta.pocketnexus.app).
 */
export const FORBIDDEN_SUPABASE_REFS = ['cdmzrsvwztndqfwzsumo'] as const;

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const publishableKey = z
  .string()
  .min(20)
  .refine((k) => !k.startsWith('sb_secret_'), {
    message: 'A Supabase SECRET key was supplied to the browser. Use the publishable key.',
  })
  .refine((k) => !looksLikeServiceRoleJwt(k), {
    message: 'A service_role JWT was supplied to the browser. Use the publishable/anon key.',
  });

const supabaseUrl = z
  .url()
  .refine((u) => !FORBIDDEN_SUPABASE_REFS.some((ref) => u.includes(ref)), {
    message: 'This Supabase URL belongs to the legacy production project and is not allowed in V2.',
  });

export const clientEnvSchema = z
  .object({
    VITE_APP_ENV: z.enum(APP_ENVIRONMENTS).default('development'),
    VITE_SUPABASE_URL: z.preprocess(emptyToUndefined, supabaseUrl.optional()),
    VITE_SUPABASE_PUBLISHABLE_KEY: z.preprocess(emptyToUndefined, publishableKey.optional()),
    VITE_SITE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  })
  .refine(
    (env) => Boolean(env.VITE_SUPABASE_URL) === Boolean(env.VITE_SUPABASE_PUBLISHABLE_KEY),
    { message: 'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set together.' },
  );

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export type SupabaseConfig =
  | { readonly status: 'configured'; readonly url: string; readonly publishableKey: string }
  | { readonly status: 'missing' }
  | { readonly status: 'invalid'; readonly issues: readonly string[] };

export interface ParsedClientEnv {
  readonly appEnv: ClientEnv['VITE_APP_ENV'];
  readonly siteUrl: string | undefined;
  readonly supabase: SupabaseConfig;
}

/**
 * Parse raw `import.meta.env`. Never throws: an invalid configuration is
 * reported as data so the app can render a clear "not configured" state
 * instead of a blank screen.
 */
export function parseClientEnv(raw: Record<string, unknown>): ParsedClientEnv {
  const result = clientEnvSchema.safeParse(raw);
  if (!result.success) {
    const appEnv = z.enum(APP_ENVIRONMENTS).catch('development').parse(raw['VITE_APP_ENV']);
    return {
      appEnv,
      siteUrl: undefined,
      supabase: { status: 'invalid', issues: result.error.issues.map((i) => i.message) },
    };
  }
  const env = result.data;
  const supabase: SupabaseConfig =
    env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY
      ? {
          status: 'configured',
          url: env.VITE_SUPABASE_URL,
          publishableKey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
        }
      : { status: 'missing' };
  return { appEnv: env.VITE_APP_ENV, siteUrl: env.VITE_SITE_URL, supabase };
}

function looksLikeServiceRoleJwt(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return false;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1])) as { role?: unknown };
    return payload.role === 'service_role';
  } catch {
    return false;
  }
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}
