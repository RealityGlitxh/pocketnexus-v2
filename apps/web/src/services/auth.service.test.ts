import { describe, expect, it } from 'vitest';
import { requestPasswordReset, signIn, signOut, signUp, updatePassword } from './auth.service';

// The test environment has no VITE_SUPABASE_* values, mirroring a build with
// no backend connected. These tests prove the service fails safe and
// validates input before any network call would be attempted.

describe('auth.service without a configured backend', () => {
  it('rejects invalid input before contacting the backend', async () => {
    const r = await signIn({ email: 'not-an-email', password: 'x' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('invalid_input');
  });

  it('reports not_configured for valid input', async () => {
    const results = await Promise.all([
      signIn({ email: 'a@example.com', password: 'whatever' }),
      signUp({
        email: 'a@example.com',
        username: 'trainer_a',
        password: 'pikachu12345',
        confirmPassword: 'pikachu12345',
      }),
      requestPasswordReset({ email: 'a@example.com' }),
      updatePassword({ password: 'pikachu12345', confirmPassword: 'pikachu12345' }),
      signOut(),
    ]);
    for (const r of results) {
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.code).toBe('not_configured');
        expect(r.error.message).not.toMatch(/supabase|undefined|null/i);
      }
    }
  });
});
