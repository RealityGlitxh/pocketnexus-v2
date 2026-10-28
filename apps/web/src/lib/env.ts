import { parseClientEnv, type ParsedClientEnv } from '@pocketnexus/shared';

/**
 * Validated client environment. Parsed once at module load; never throws.
 * A misconfigured build renders an explicit "not configured" state rather
 * than failing silently or talking to the wrong backend.
 */
export const env: ParsedClientEnv = parseClientEnv(import.meta.env);
