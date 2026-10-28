import { Button, ErrorState, Spinner } from '@pocketnexus/ui';
import { KeyRound, PlugZap } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { useAuth } from './authContext';

/**
 * Route guard. Renders children only for signed-in users.
 *  - signed_out → redirect to sign-in, preserving the return path
 *  - disabled   → explain that accounts aren't configured (never pretend)
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const location = useLocation();

  switch (state.status) {
    case 'signed_in':
      return <>{children}</>;
    case 'loading':
      return (
        <div className="grid min-h-64 place-items-center">
          <Spinner label="Checking your session" />
        </div>
      );
    case 'signed_out':
      return (
        <Navigate
          to="/auth/sign-in"
          replace
          state={{ from: location.pathname + location.search }}
        />
      );
    case 'disabled':
      return (
        <ErrorState
          icon={PlugZap}
          title="Accounts aren't connected yet"
          description="This page needs a signed-in account, but this build isn't connected to an authentication backend. See docs/DEPLOYMENT.md to configure a development Supabase project."
        />
      );
    case 'error':
      return (
        <ErrorState
          icon={KeyRound}
          title="We couldn't check your session"
          description="The authentication service could not be reached."
          action={
            <Button asChild variant="secondary" size="sm">
              <Link to="/">Back to dashboard</Link>
            </Button>
          }
        />
      );
  }
}
