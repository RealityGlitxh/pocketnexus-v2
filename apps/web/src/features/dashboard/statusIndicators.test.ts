import { describe, expect, it } from 'vitest';
import { deriveIndicators } from './statusIndicators';

const signedIn = { status: 'signed_in', user: { id: 'u1', email: null } } as const;

const statuses = (r: ReturnType<typeof deriveIndicators>) => r.map((i) => `${i.label}=${i.status}`);

describe('deriveIndicators', () => {
  it('missing config: configured fails, the rest are skipped (never "connected")', () => {
    const r = deriveIndicators({
      configStatus: 'missing',
      health: null,
      auth: { status: 'disabled', reason: 'missing' },
    });
    expect(statuses(r)).toEqual([
      'Configured=failed',
      'Reachable=skipped',
      'Authenticated=skipped',
    ]);
  });

  it('invalid config is reported as invalid, not missing', () => {
    const r = deriveIndicators({
      configStatus: 'invalid',
      health: null,
      auth: { status: 'disabled', reason: 'invalid' },
    });
    expect(r[0].detail).toMatch(/invalid/);
  });

  it('configured but unreachable is distinguishable from configured and reachable', () => {
    const down = deriveIndicators({
      configStatus: 'configured',
      health: { status: 'failed', message: 'The backend could not be reached.' },
      auth: { status: 'signed_out' },
    });
    expect(statuses(down)).toEqual(['Configured=ok', 'Reachable=failed', 'Authenticated=skipped']);

    const up = deriveIndicators({
      configStatus: 'configured',
      health: { status: 'ok', latencyMs: 42 },
      auth: { status: 'signed_out' },
    });
    expect(statuses(up)).toEqual(['Configured=ok', 'Reachable=ok', 'Authenticated=skipped']);
    expect(up[1].detail).toBe('Auth service responded in 42 ms');
  });

  it('reachable and signed in: all three OK', () => {
    const r = deriveIndicators({
      configStatus: 'configured',
      health: { status: 'ok', latencyMs: 10 },
      auth: signedIn,
    });
    expect(statuses(r)).toEqual(['Configured=ok', 'Reachable=ok', 'Authenticated=ok']);
  });

  it('shows pending states while checks run', () => {
    const r = deriveIndicators({
      configStatus: 'configured',
      health: { status: 'pending' },
      auth: { status: 'loading' },
    });
    expect(statuses(r)).toEqual(['Configured=ok', 'Reachable=pending', 'Authenticated=pending']);
  });

  it('session check errors are failures, not "signed out"', () => {
    const r = deriveIndicators({
      configStatus: 'configured',
      health: { status: 'ok', latencyMs: 5 },
      auth: { status: 'error' },
    });
    expect(r[2].status).toBe('failed');
  });
});
