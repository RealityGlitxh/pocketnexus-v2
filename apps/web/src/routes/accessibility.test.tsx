import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/renderApp';

describe('navigation accessibility', () => {
  it('sets a per-page document title', async () => {
    const { router } = renderApp('/');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    expect(document.title).toBe('Dashboard · PocketNexus');
    await router.navigate('/meta');
    await screen.findByRole('heading', { level: 1, name: 'Meta Center' });
    expect(document.title).toBe('Meta Center · PocketNexus');
  });

  it('sets titles on auth pages too', async () => {
    renderApp('/auth/forgot-password');
    await screen.findByRole('heading', { level: 1, name: 'Reset your password' });
    expect(document.title).toBe('Reset your password · PocketNexus');
  });

  it('moves focus to main content after sidebar navigation', async () => {
    renderApp('/');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    const nav = screen.getAllByRole('navigation', { name: 'Primary' })[0]!;
    await userEvent.click(within(nav).getByRole('link', { name: /Settings/ }));
    await screen.findByRole('heading', { level: 1, name: 'Settings' });
    await waitFor(() => {
      expect(document.activeElement).toBe(document.getElementById('main'));
    });
  });

  it('does not steal focus on the initial page load', async () => {
    renderApp('/');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    expect(document.activeElement).not.toBe(document.getElementById('main'));
  });

  it('moves focus to main content after navigating from the mobile drawer', async () => {
    renderApp('/');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    const drawer = await screen.findByRole('dialog', { name: 'Navigation' });
    await userEvent.click(within(drawer).getByRole('link', { name: /Card Database/ }));
    await screen.findByRole('heading', { level: 1, name: 'Card Database' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument();
      expect(document.activeElement).toBe(document.getElementById('main'));
    });
  });

  it('returns focus to the menu button when the drawer is dismissed with Escape', async () => {
    renderApp('/');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    const menuButton = screen.getByRole('button', { name: 'Open navigation' });
    await userEvent.click(menuButton);
    await screen.findByRole('dialog', { name: 'Navigation' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(document.activeElement).toBe(menuButton);
    });
  });

  it('gives placeholder nav links a clear accessible name', async () => {
    renderApp('/');
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    const nav = screen.getAllByRole('navigation', { name: 'Primary' })[0]!;
    expect(within(nav).getByRole('link', { name: 'Deck Lab (in development)' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });
});
