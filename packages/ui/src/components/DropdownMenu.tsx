import * as Menu from '@radix-ui/react-dropdown-menu';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '../lib/cn';

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuGroup = Menu.Group;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = 'end',
  ...props
}: ComponentPropsWithoutRef<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 min-w-48 overflow-hidden rounded-lg border border-border bg-surface-overlay p-1 shadow-lg',
          'data-[state=open]:animate-fade-in',
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  );
}

export function DropdownMenuItem({
  className,
  destructive = false,
  ...props
}: ComponentPropsWithoutRef<typeof Menu.Item> & { destructive?: boolean }) {
  return (
    <Menu.Item
      className={cn(
        'flex cursor-default items-center gap-2 rounded-md px-2.5 py-2 text-sm text-fg outline-none select-none',
        'data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-surface-raised',
        '[&_svg]:size-4 [&_svg]:text-fg-subtle',
        destructive && 'text-danger-text data-highlighted:bg-danger-soft [&_svg]:text-danger-text',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Menu.Label>) {
  return (
    <Menu.Label
      className={cn('px-2.5 py-1.5 text-xs font-medium text-fg-subtle', className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Menu.Separator>) {
  return <Menu.Separator className={cn('my-1 h-px bg-border', className)} {...props} />;
}
