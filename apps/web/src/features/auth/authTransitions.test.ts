import { describe, expect, it } from 'vitest';
import type { AuthState } from './authContext';
import { identityChanged, nextAuthState } from './authTransitions';

const alice = { user: { id: 'u-alice', email: 'alice@example.test' } };
const bob = { user: { id: 'u-bob', email: 'bob@example.test' } };
const signedInAlice: AuthState = { status: 'signed_in', user: { id: 'u-alice', email: 'alice@example.test' } };

describe('nextAuthState', () => {
  it('loading → signed_in on a session', () => {
    expect(nextAuthState({ status: 'loading' }, alice)).toEqual(signedInAlice);
  });

  it('loading → signed_out without a session', () => {
    expect(nextAuthState({ status: 'loading' }, null)).toEqual({ status: 'signed_out' });
  });

  it('keeps the same object for the same identity (token refresh)', () => {
    expect(nextAuthState(signedInAlice, alice)).toBe(signedInAlice);
  });

  it('keeps the same object for repeated sign-outs', () => {
    const out: AuthState = { status: 'signed_out' };
    expect(nextAuthState(out, null)).toBe(out);
  });

  it('produces a new state when the email changes', () => {
    const next = nextAuthState(signedInAlice, { user: { id: 'u-alice', email: 'new@example.test' } });
    expect(next).toEqual({ status: 'signed_in', user: { id: 'u-alice', email: 'new@example.test' } });
  });

  it('normalises a missing email to null', () => {
    expect(nextAuthState({ status: 'loading' }, { user: { id: 'x' } })).toEqual({
      status: 'signed_in',
      user: { id: 'x', email: null },
    });
  });
});

describe('identityChanged (drives user-scoped cache purge)', () => {
  it('is true on sign-out', () => {
    expect(identityChanged(signedInAlice, { status: 'signed_out' })).toBe(true);
  });

  it('is true when a different user signs in without a sign-out in between', () => {
    expect(identityChanged(signedInAlice, nextAuthState(signedInAlice, bob))).toBe(true);
  });

  it('is false for token refreshes of the same user', () => {
    expect(identityChanged(signedInAlice, nextAuthState(signedInAlice, alice))).toBe(false);
  });

  it('is false on first sign-in (nothing cached to leak)', () => {
    expect(identityChanged({ status: 'loading' }, signedInAlice)).toBe(false);
    expect(identityChanged({ status: 'signed_out' }, signedInAlice)).toBe(false);
  });
});
