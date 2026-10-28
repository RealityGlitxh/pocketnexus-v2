import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  badge,
  actions,
}: {
  title: string;
  description?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-fg sm:text-3xl">{title}</h1>
          {badge}
        </div>
        {description ? <p className="max-w-2xl text-sm text-fg-muted sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </header>
  );
}
