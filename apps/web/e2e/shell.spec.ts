import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const ROUTES = [
  { path: '/', heading: 'Dashboard' },
  { path: '/cards', heading: 'Card Database' },
  { path: '/decks', heading: 'Deck Lab' },
  { path: '/battles', heading: 'Battle Tracker' },
  { path: '/meta', heading: 'Meta Center' },
  { path: '/profile', heading: 'Profile' },
  { path: '/settings', heading: 'Settings' },
  { path: '/auth/sign-in', heading: 'Sign in' },
  { path: '/auth/sign-up', heading: 'Create your account' },
];

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  return errors;
}

for (const { path, heading } of ROUTES) {
  test(`${path} renders without errors, overflow, or a11y violations`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();

    // No horizontal page scroll at any viewport.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);

    // The unofficial disclaimer is always present.
    await expect(page.getByText(/not affiliated with/i).first()).toBeAttached();

    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);

    expect(errors).toEqual([]);
  });
}

test('navigation works on every viewport', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();

  const viewport = page.viewportSize();
  const usesDrawer = isMobile || (viewport !== null && viewport.width < 1024);

  if (usesDrawer) {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    const drawer = page.getByRole('dialog', { name: 'Navigation' });
    await expect(drawer).toBeVisible();
    await drawer.getByRole('link', { name: /Battle Tracker/ }).click();
    await expect(drawer).toBeHidden();
  } else {
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeHidden();
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: /Battle Tracker/ }).click();
  }
  await expect(page).toHaveURL(/\/battles$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Battle Tracker' })).toBeVisible();
});

test('dashboard does not load the Supabase SDK when no backend is configured', async ({ page }) => {
  test.skip(Boolean(process.env.VITE_SUPABASE_URL), 'only meaningful for unconfigured builds');
  const requested: string[] = [];
  page.on('request', (r) => requested.push(r.url()));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
  expect(requested.filter((u) => /\/assets\/supabase-[\w-]+\.js$/.test(u))).toEqual([]);
});

test('keyboard users can skip to content', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard navigation is a desktop concern');
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('theme preference persists across reloads', async ({ page }) => {
  await page.goto('/settings');
  await page.getByText('Light', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
