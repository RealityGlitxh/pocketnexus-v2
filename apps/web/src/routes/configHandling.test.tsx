import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Graceful handling of missing and invalid Supabase configuration.
 * The env module is replaced per test; the Supabase SDK module is replaced
 * with a tripwire so we can prove it is never imported in either case.
 */
const envState = vi.hoisted(() => ({
  supabase: { status: 'missing' } as { status: 'missing' } | { status: 'invalid'; issues: string[] },
}));
const sdk = vi.hoisted(() => ({ imported: false }));

vi.mock('@/lib/env', () => ({
  get env() {
    return { appEnv: 'development', siteUrl: undefined, supabase: envState.supabase };
  },
}));
vi.mock('@supabase/supabase-js', () => {
  sdk.imported = true;
  return { createClient: () => ({}) };
});

const { renderApp } = await import('@/test/renderApp');

afterEach(() => {
  envState.supabase = { status: 'missing' };
});

describe.each([
  ['missing', { status: 'missing' } as const, /not connected/i, 'No backend configured for this build'],
  [
    'invalid',
    { status: 'invalid', issues: ['A Supabase SECRET key was supplied to the browser.'] } as const,
    /configuration .* is invalid/i,
    'Configuration is invalid — accounts disabled',
  ],
])('%s Supabase configuration', (_name, supabase, noticeText, dashboardText) => {
  it('dashboard reports it without claiming connectivity', async () => {
    envState.supabase = supabase as typeof envState.supabase;
    renderApp('/');
    const heading = await screen.findByRole('heading', { name: 'System status' });
    const card = heading.closest('section')!;
    expect(within(card).getByText(dashboardText)).toBeInTheDocument();
    expect(within(card).getByText('Skipped — no backend configured')).toBeInTheDocument();
  });

  it('auth forms explain why they are disabled', async () => {
    envState.supabase = supabase as typeof envState.supabase;
    renderApp('/auth/sign-up');
    await screen.findByRole('heading', { level: 1, name: 'Create your account' });
    expect(screen.getByRole('note')).toHaveTextContent(noticeText);
    expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled();
    // Configuration issue details are never shown to end users.
    expect(document.body).not.toHaveTextContent(/SECRET key/);
  });

  it('protected routes explain instead of redirecting to a sign-in that cannot work', async () => {
    envState.supabase = supabase as typeof envState.supabase;
    const { router } = renderApp('/profile');
    expect(await screen.findByRole('heading', { name: "Accounts aren't connected yet" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/profile');
  });

  it('never downloads the Supabase SDK', async () => {
    envState.supabase = supabase as typeof envState.supabase;
    renderApp('/settings');
    await screen.findByRole('heading', { level: 1, name: 'Settings' });
    expect(sdk.imported).toBe(false);
  });
});
