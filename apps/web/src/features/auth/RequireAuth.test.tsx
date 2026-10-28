import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AuthContext, type AuthState } from './authContext';
import { RequireAuth } from './RequireAuth';

function renderGuard(state: AuthState) {
  const router = createMemoryRouter(
    [
      {
        path: '/secret',
        element: (
          <RequireAuth>
            <p>Secret content</p>
          </RequireAuth>
        ),
      },
      { path: '/auth/sign-in', element: <p>Sign-in page</p> },
    ],
    { initialEntries: ['/secret?tab=1'] },
  );
  render(
    <AuthContext.Provider value={{ state, isPasswordRecovery: false }}>
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );
  return router;
}

describe('RequireAuth', () => {
  it('renders children for signed-in users', () => {
    renderGuard({ status: 'signed_in', user: { id: 'u1', email: 'a@b.test' } });
    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });

  it('redirects signed-out users to sign-in and remembers where they were going', () => {
    const router = renderGuard({ status: 'signed_out' });
    expect(screen.getByText('Sign-in page')).toBeInTheDocument();
    expect(router.state.location.state).toEqual({ from: '/secret?tab=1' });
  });

  it('shows a loading state while the session is being checked', () => {
    renderGuard({ status: 'loading' });
    expect(screen.getByRole('status')).toHaveTextContent('Checking your session');
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });

  it('never pretends auth works when it is not configured', () => {
    renderGuard({ status: 'disabled', reason: 'missing' });
    expect(screen.getByRole('alert')).toHaveTextContent("Accounts aren't connected yet");
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });
});
