import { UNOFFICIAL_DISCLAIMER } from '@pocketnexus/shared';
import { cn, focusRing } from '@pocketnexus/ui';
import { Suspense } from 'react';
import { Link, Outlet } from 'react-router';
import { BrandMark } from '@/components/BrandMark';
import { RouteFallback } from '@/components/RouteFallback';

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-ambient">
      <header className="flex h-(--spacing-topbar) items-center px-4 sm:px-6">
        <Link to="/" className={cn('rounded-md', focusRing)} aria-label="PocketNexus home">
          <BrandMark />
        </Link>
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="mx-auto max-w-2xl px-4 pb-6 text-center text-xs text-fg-subtle">
        {UNOFFICIAL_DISCLAIMER}
      </footer>
    </div>
  );
}
