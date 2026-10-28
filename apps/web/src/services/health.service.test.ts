import { afterEach, describe, expect, it, vi } from 'vitest';

const envState = vi.hoisted(() => ({
  supabase: { status: 'missing' } as
    | { status: 'missing' }
    | { status: 'configured'; url: string; publishableKey: string },
}));

vi.mock('@/lib/env', () => ({
  get env() {
    return { appEnv: 'development', siteUrl: undefined, supabase: envState.supabase };
  },
}));

const { checkBackendHealth } = await import('./health.service');

afterEach(() => {
  envState.supabase = { status: 'missing' };
  vi.useRealTimers();
});

const configure = () => {
  envState.supabase = {
    status: 'configured',
    url: 'https://abcdefghijklmnop.supabase.co',
    publishableKey: 'sb_publishable_test',
  };
};

describe('checkBackendHealth', () => {
  it('does not make a request when Supabase is not configured', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const r = await checkBackendHealth(fetchImpl);
    expect(r).toEqual({ ok: false, error: expect.objectContaining({ code: 'not_configured' }) });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('calls the auth health endpoint with the publishable key', async () => {
    configure();
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 200 }));
    const r = await checkBackendHealth(fetchImpl);
    expect(r.ok).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toBe('https://abcdefghijklmnop.supabase.co/auth/v1/health');
    expect(init?.headers).toEqual({ apikey: 'sb_publishable_test' });
  });

  it('reports HTTP errors as unreachable with a safe message', async () => {
    configure();
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('nope', { status: 503 }));
    const r = await checkBackendHealth(fetchImpl);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe('The backend responded with an error (HTTP 503).');
  });

  it('reports network failures without leaking the raw error', async () => {
    configure();
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch: secret detail'));
    const r = await checkBackendHealth(fetchImpl);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('network');
      expect(r.error.message).not.toMatch(/secret detail/);
    }
  });

  it('times out after 5 seconds', async () => {
    configure();
    vi.useFakeTimers();
    const fetchImpl = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        }),
    );
    const pending = checkBackendHealth(fetchImpl);
    await vi.advanceTimersByTimeAsync(5000);
    const r = await pending;
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/within 5 seconds/);
  });
});
