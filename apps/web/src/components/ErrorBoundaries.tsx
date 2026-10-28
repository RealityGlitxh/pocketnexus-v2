import { Button, ErrorState } from '@pocketnexus/ui';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

/**
 * Last-resort boundary around the whole app. Shows a safe message only;
 * error details go to the console (and, in Phase 1, an error reporter).
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('[PocketNexus] Unhandled UI error', error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <ErrorState
          title="PocketNexus hit an unexpected error"
          description="Reloading usually fixes this. If it keeps happening, please let us know."
          action={
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              Reload
            </Button>
          }
        />
      </main>
    );
  }
}

/** Route-level boundary: a failure in one page never takes down the shell. */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  if (!notFound) console.error('[PocketNexus] Route error', error);

  // A failed lazy chunk usually means a new deploy replaced old assets.
  const chunkFailed =
    error instanceof Error &&
    /Failed to fetch dynamically imported module|Importing a module script failed/i.test(
      error.message,
    );

  return (
    <ErrorState
      title={
        notFound
          ? 'Page not found'
          : chunkFailed
            ? 'A new version is available'
            : 'This page failed to load'
      }
      description={
        notFound
          ? 'The page you were looking for does not exist.'
          : chunkFailed
            ? 'PocketNexus was updated while you were using it. Reload to get the latest version.'
            : 'The rest of PocketNexus still works. Try again, or head back to the dashboard.'
      }
      action={
        <div className="flex gap-2">
          {chunkFailed ? (
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              Reload
            </Button>
          ) : null}
          <Button asChild variant="secondary">
            <Link to="/">Go to dashboard</Link>
          </Button>
        </div>
      }
    />
  );
}
