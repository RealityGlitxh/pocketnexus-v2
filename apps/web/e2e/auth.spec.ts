import type { Database } from '@pocketnexus/database';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test, type Page } from '@playwright/test';

/**
 * Authenticated end-to-end checks against a deployed environment (staging).
 *
 * Requires two dedicated, pre-confirmed TEST accounts in the development
 * Supabase project, supplied only via CI secrets — never real users:
 *   E2E_USER_A_EMAIL / E2E_USER_A_PASSWORD
 *   E2E_USER_B_EMAIL / E2E_USER_B_PASSWORD
 * plus the public project URL / publishable key for the API-level RLS checks.
 * Without them the whole file is skipped (e.g. in pull-request CI).
 */
const A = { email: process.env.E2E_USER_A_EMAIL ?? '', password: process.env.E2E_USER_A_PASSWORD ?? '' };
const B = { email: process.env.E2E_USER_B_EMAIL ?? '', password: process.env.E2E_USER_B_PASSWORD ?? '' };
const SUPABASE_URL = process.env.E2E_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.E2E_SUPABASE_PUBLISHABLE_KEY ?? '';
const configured = Boolean(A.email && A.password && B.email && B.password && SUPABASE_URL && SUPABASE_KEY);

test.skip(!configured, 'E2E test accounts / Supabase config not provided');

async function signIn(page: Page, user: { email: string; password: string }) {
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test.describe('authentication (UI)', () => {
  test('sign in, session survives reload, profile loads, sign out', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await expect(page.getByRole('note')).toHaveCount(0); // backend is configured on staging
    await signIn(page, A);

    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Authenticated: OK')).toBeVisible();
    await expect(page.getByText('Reachable: OK')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Authenticated: OK')).toBeVisible();

    await page.goto('/profile');
    await expect(page.getByText('Username', { exact: true })).toBeVisible();
    await expect(page.getByText('Member since')).toBeVisible();

    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
  });

  test('protected route redirects to sign-in and returns after login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
    await signIn(page, A);
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByText('Username', { exact: true })).toBeVisible();
  });

  test('wrong password shows a safe error and no session', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await signIn(page, { email: A.email, password: `${A.password}-wrong` });
    await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect.');
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
  });
});

test.describe('row level security via the public API', () => {
  // Data-level checks: run once, not once per browser project.
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || isMobile, 'run once');

  const client = (): SupabaseClient<Database> =>
    createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

  test('users cannot read or modify each other’s private data', async () => {
    const alice = client();
    const bob = client();
    const anon = client();
    const a = await alice.auth.signInWithPassword(A);
    const b = await bob.auth.signInWithPassword(B);
    expect(a.error).toBeNull();
    expect(b.error).toBeNull();
    const aliceId = a.data.user!.id;
    const bobId = b.data.user!.id;

    // Profiles are created by the database trigger at sign-up.
    const own = await alice.from('profiles').select('id, visibility').eq('id', aliceId).single();
    expect(own.error).toBeNull();
    expect(own.data?.visibility).toBe('private');
    const peek = await bob.from('profiles').select('id').eq('id', aliceId);
    expect(peek.data).toEqual([]); // private profile invisible to others
    const prefs = await bob.from('user_preferences').select('user_id').eq('user_id', aliceId);
    expect(prefs.data).toEqual([]);

    const name = `e2e-rls-${Date.now()}`;
    const created = await alice
      .from('decks')
      .insert({ owner_id: aliceId, name, visibility: 'private' })
      .select('id')
      .single();
    expect(created.error).toBeNull();
    const deckId = created.data!.id;

    try {
      expect((await alice.from('decks').select('id').eq('id', deckId)).data).toHaveLength(1);
      expect((await bob.from('decks').select('id').eq('id', deckId)).data).toEqual([]);
      expect((await anon.from('decks').select('id').eq('id', deckId)).data).toEqual([]);

      const hijack = await bob.from('decks').update({ name: 'pwned' }).eq('id', deckId).select('id');
      expect(hijack.data ?? []).toEqual([]);
      const wipe = await bob.from('decks').delete().eq('id', deckId).select('id');
      expect(wipe.data ?? []).toEqual([]);

      const forged = await bob.from('decks').insert({ owner_id: aliceId, name: 'forged' });
      expect(forged.error).not.toBeNull(); // cannot create rows owned by someone else

      const shared = await bob.rpc('get_shared_deck', { p_deck_id: deckId });
      expect(shared.data ?? []).toEqual([]); // private decks never shared

      const match = await alice
        .from('match_records')
        .insert({ owner_id: aliceId, result: 'win', mode: 'casual', played_at: new Date().toISOString() })
        .select('id')
        .single();
      expect(match.error).toBeNull();
      expect((await bob.from('match_records').select('id').eq('id', match.data!.id)).data).toEqual([]);
      await alice.from('match_records').delete().eq('id', match.data!.id);

      const still = await alice.from('decks').select('name').eq('id', deckId).single();
      expect(still.data?.name).toBe(name);
      expect(bobId).not.toBe(aliceId);
    } finally {
      await alice.from('decks').delete().eq('id', deckId); // remove only what this test created
      await Promise.all([alice.auth.signOut(), bob.auth.signOut()]);
    }
  });
});
