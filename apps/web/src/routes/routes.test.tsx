import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/renderApp';
import { accountNav, primaryNav } from './navigation';

describe('application shell', () => {
  it('renders the dashboard with the unofficial disclaimer', async () => {
    renderApp('/');
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText(/not affiliated with, endorsed/i)).toBeInTheDocument();
  });

  it('reports the backend honestly when it is not configured', async () => {
    renderApp('/');
    const status = await screen.findByRole('heading', { name: 'System status' });
    const card = status.closest('section')!;
    expect(within(card).getByText('No backend configured for this build')).toBeInTheDocument();
    expect(within(card).getByText('Skipped — no backend configured')).toBeInTheDocument();
    expect(within(card).getByText('Accounts unavailable in this build')).toBeInTheDocument();
    // Must never claim a connection that wasn't verified.
    expect(within(card).queryByText(/connected/i)).toBeNull();
  });

  it.each(primaryNav.filter((n) => n.to !== '/').map((n) => [n.label, n.to]))(
    '%s placeholder is clearly marked unfinished',
    async (label, to) => {
      renderApp(to);
      expect(await screen.findByRole('heading', { level: 1, name: label })).toBeInTheDocument();
      expect(screen.getByText('In development')).toBeInTheDocument();
      expect(screen.getByText(/No data shown here is real/i)).toBeInTheDocument();
    },
  );

  it('navigates via the sidebar and marks the active link', async () => {
    renderApp('/');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    const nav = screen.getAllByRole('navigation', { name: 'Primary' })[0]!;
    await userEvent.click(within(nav).getByRole('link', { name: /Deck Lab/ }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Deck Lab' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /Deck Lab/ })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: /Dashboard/ })).not.toHaveAttribute('aria-current');
  });

  it('exposes every nav entry exactly once in the sidebar', async () => {
    renderApp('/');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    const nav = screen.getAllByRole('navigation', { name: 'Primary' })[0]!;
    for (const entry of [...primaryNav, ...accountNav]) {
      expect(within(nav).getAllByRole('link', { name: new RegExp(entry.label) })).toHaveLength(1);
    }
  });

  it('opens and closes the mobile navigation drawer', async () => {
    renderApp('/');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    const openBtn = screen.getByRole('button', { name: 'Open navigation' });
    await userEvent.click(openBtn);
    const drawer = await screen.findByRole('dialog', { name: 'Navigation' });
    await userEvent.click(within(drawer).getByRole('link', { name: /Meta Center/ }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Meta Center' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument();
  });

  it('shows a not-found page for unknown routes', async () => {
    renderApp('/definitely-not-a-page');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('protected profile route explains that accounts are not connected', async () => {
    renderApp('/profile');
    expect(await screen.findByRole('heading', { name: "Accounts aren't connected yet" })).toBeInTheDocument();
  });

  it('auth forms are visibly disabled when no backend is configured', async () => {
    renderApp('/auth/sign-in');
    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(/not connected/i);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  });
});

describe('settings', () => {
  it('persists the theme choice and applies it to <html>', async () => {
    renderApp('/settings');
    await screen.findByRole('heading', { level: 1, name: 'Settings' });
    await userEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('pn.theme')).toBe('light');
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
