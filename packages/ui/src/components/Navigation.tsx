import { Slot } from '@radix-ui/react-slot';
import type { LucideIcon } from 'lucide-react';
import {
  cloneElement,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn, focusRing } from '../lib/cn';

/**
 * Router-agnostic navigation primitives. The app passes a router <NavLink>
 * as the single child so this package never depends on react-router.
 * Active state is read from `aria-current="page"`, which NavLink sets.
 */
export function NavSection({
  label,
  children,
  className,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      {label ? (
        <p className="px-3 pt-4 pb-1.5 text-2xs font-semibold tracking-widest text-fg-subtle uppercase">
          {label}
        </p>
      ) : null}
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  );
}

export interface NavItemProps extends HTMLAttributes<HTMLElement> {
  icon: LucideIcon;
  label: string;
  /** Optional trailing element, e.g. a "Preview" badge. */
  trailing?: ReactNode;
  /** A single link element, e.g. <NavLink to="/decks" />. */
  children: ReactElement<{ children?: ReactNode }>;
}

export function NavItem({ icon: Icon, label, trailing, children, className, ...props }: NavItemProps) {
  const content = (
    <>
      <Icon
        aria-hidden
        className="size-4 shrink-0 text-fg-subtle transition-colors group-hover:text-fg-muted group-aria-[current=page]:text-primary-text"
      />
      <span className="truncate">{label}</span>
      {trailing ? <span className="ml-auto">{trailing}</span> : null}
    </>
  );

  return (
    <li>
      <Slot
        className={cn(
          'group relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium text-fg-muted',
          'transition-colors duration-(--duration-fast) hover:bg-surface-raised hover:text-fg',
          'aria-[current=page]:bg-primary-soft aria-[current=page]:text-fg',
          'before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary before:opacity-0 aria-[current=page]:before:opacity-100',
          focusRing,
          className,
        )}
        {...props}
      >
        {isValidElement(children) ? cloneElement(children, undefined, content) : children}
      </Slot>
    </li>
  );
}
