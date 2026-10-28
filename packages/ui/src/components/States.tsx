import { AlertOctagon, Inbox, type LucideIcon } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

/** Loading placeholder. Decorative: wrap groups in an element with aria-busy. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--pn-surface-raised)_0%,var(--pn-surface-overlay)_50%,var(--pn-surface-raised)_100%)] bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  );
}

export function Spinner({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-fg-muted', className)}>
      <span
        aria-hidden
        className="size-4 animate-spin rounded-full border-2 border-border-strong border-t-primary"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

interface StateProps {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: StateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center',
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-surface-raised text-fg-subtle">
        <Icon aria-hidden className="size-6" />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="font-display text-base font-semibold text-fg">{title}</h3>
        {description ? <p className="text-sm text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  icon: Icon = AlertOctagon,
  action,
  className,
}: StateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-danger/30 bg-danger-soft px-6 py-12 text-center',
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger-text">
        <Icon aria-hidden className="size-6" />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="font-display text-base font-semibold text-fg">{title}</h3>
        {description ? <p className="text-sm text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
