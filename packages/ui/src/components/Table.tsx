import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import { cn } from '../lib/cn';

/**
 * Semantic table primitives. The wrapper scrolls horizontally on narrow
 * screens so tables never cause page-level overflow. For >200 rows, pair with
 * @tanstack/react-virtual rather than rendering every row.
 */
export function Table({
  className,
  caption,
  children,
  ...props
}: TableHTMLAttributes<HTMLTableElement> & { caption?: string }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className={cn('w-full caption-bottom border-collapse text-sm', className)} {...props}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-surface-raised', className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('border-b border-border transition-colors hover:bg-surface-raised/60', className)}
      {...props}
    />
  );
}

export function TableHead({ className, scope, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope={scope ?? 'col'}
      className={cn(
        'h-10 px-4 text-left align-middle text-xs font-semibold tracking-wide whitespace-nowrap text-fg-muted uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-middle text-fg', className)} {...props} />;
}
