import { APP_NAME } from '@pocketnexus/shared';
import { cn } from '@pocketnexus/ui';

export function BrandMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <svg aria-hidden viewBox="0 0 32 32" className="size-8 shrink-0">
        <defs>
          <linearGradient id="pn-brand" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--pn-primary)" />
            <stop offset="1" stopColor="var(--pn-accent)" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" className="fill-surface-raised" />
        <path
          d="M9 23V9h7.5a4.5 4.5 0 0 1 0 9H13"
          fill="none"
          stroke="url(#pn-brand)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="22.5" cy="22.5" r="2.5" className="fill-accent" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-display text-base font-bold tracking-tight text-fg">{APP_NAME}</span>
        {compact ? null : (
          <span className="text-2xs font-medium tracking-widest text-fg-subtle uppercase">
            Unofficial companion
          </span>
        )}
      </span>
    </span>
  );
}
