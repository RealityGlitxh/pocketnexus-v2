import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentPropsWithoutRef } from 'react';
import { cn, focusRing } from '../lib/cn';

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-border bg-surface-sunken p-1',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap text-fg-muted',
        'transition-colors duration-(--duration-fast) hover:text-fg',
        'data-[state=active]:bg-surface-raised data-[state=active]:text-fg data-[state=active]:shadow-sm',
        'disabled:pointer-events-none disabled:opacity-50',
        focusRing,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('mt-4', focusRing, className)} {...props} />;
}
