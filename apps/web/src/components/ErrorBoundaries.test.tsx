import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary, RouteErrorBoundary } from './ErrorBoundaries';

function Shell() {
  return (
    <div>
      <nav aria-label="Shell nav">shell still here</nav>
      <Outlet />
    </div>
  );
}

function renderWithRouteError(thrower: () => never, path = '/broken') {
  const router = createMemoryRouter(
    [
      {
        element: <Shell />,
        children: [
          {
            errorElement: <RouteErrorBoundary />,
            children: [
              { path: '/', element: <p>Home</p> },
              {
                path: '/broken',
                Component: () => thrower(),
              },
            ],
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('RouteErrorBoundary', () => {
  it('contains a page crash inside the shell and offers a way back', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const router = renderWithRouteError(() => {
      throw new Error('kaboom with internal detail');
    });
    expect(screen.getByRole('alert')).toHaveTextContent('This page failed to load');
    expect(screen.getByText('shell still here')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('internal detail');
    await userEvent.click(screen.getByRole('link', { name: 'Go to dashboard' }));
    expect(router.state.location.pathname).toBe('/');
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('recognises a stale chunk after a deploy and offers a reload', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderWithRouteError(() => {
      throw new TypeError('Failed to fetch dynamically imported module: /assets/x.js');
    });
    expect(screen.getByRole('alert')).toHaveTextContent('A new version is available');
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });
});

describe('AppErrorBoundary', () => {
  it('replaces a crashed app with a safe message', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Boom = () => {
      throw new Error('secret stack detail');
    };
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('PocketNexus hit an unexpected error');
    expect(document.body).not.toHaveTextContent('secret stack detail');
  });
});
