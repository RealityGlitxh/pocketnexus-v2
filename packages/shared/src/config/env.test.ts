import { describe, expect, it } from 'vitest';
import { parseClientEnv } from './env';

const fakeJwt = (payload: object) =>
  ['eyJhbGciOiJIUzI1NiJ9', btoa(JSON.stringify(payload)).replace(/=+$/, ''), 'sig'].join('.');

describe('parseClientEnv', () => {
  it('reports missing Supabase config without throwing', () => {
    const env = parseClientEnv({});
    expect(env.appEnv).toBe('development');
    expect(env.supabase.status).toBe('missing');
  });

  it('treats empty strings as unset', () => {
    const env = parseClientEnv({ VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '  ' });
    expect(env.supabase.status).toBe('missing');
  });

  it('accepts a dev project with a publishable key', () => {
    const env = parseClientEnv({
      VITE_APP_ENV: 'staging',
      VITE_SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_0123456789abcdefghij',
    });
    expect(env.appEnv).toBe('staging');
    expect(env.supabase).toEqual({
      status: 'configured',
      url: 'https://abcdefghijklmnop.supabase.co',
      publishableKey: 'sb_publishable_0123456789abcdefghij',
    });
  });

  it('rejects the legacy production project', () => {
    const env = parseClientEnv({
      VITE_SUPABASE_URL: 'https://cdmzrsvwztndqfwzsumo.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_0123456789abcdefghij',
    });
    expect(env.supabase.status).toBe('invalid');
  });

  it('rejects secret keys in the browser', () => {
    const env = parseClientEnv({
      VITE_SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_0123456789abcdefghijklmnop',
    });
    expect(env.supabase.status).toBe('invalid');
  });

  it('rejects service_role JWTs in the browser', () => {
    const env = parseClientEnv({
      VITE_SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: fakeJwt({ role: 'service_role', iss: 'supabase' }),
    });
    expect(env.supabase.status).toBe('invalid');
  });

  it('requires URL and key together', () => {
    const env = parseClientEnv({ VITE_SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co' });
    expect(env.supabase.status).toBe('invalid');
  });
});
