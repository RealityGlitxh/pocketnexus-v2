import { Skeleton } from '@pocketnexus/ui';

/** Skeleton shown while a lazily loaded route chunk is fetched. */
export function RouteFallback() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-8">
      <span className="sr-only">Loading page</span>
      <div className="flex flex-col gap-3 border-b border-border pb-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    </div>
  );
}
