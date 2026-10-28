import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react';
import { cn, focusRing } from '../lib/cn';

/** Accessible modal dialog (focus trap, Esc to close, aria wiring via Radix). */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export interface DialogContentProps extends Omit<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
  'title'
> {
  title: ReactNode;
  description?: ReactNode;
  /** Hide the visible title while keeping it for assistive tech. */
  hideTitle?: boolean;
}

export function DialogContent({
  className,
  children,
  title,
  description,
  hideTitle = false,
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim backdrop-blur-sm data-[state=open]:animate-fade-in" />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto',
          'rounded-xl border border-border bg-surface-overlay p-6 shadow-lg data-[state=open]:animate-scale-in',
          className,
        )}
        {...(description ? {} : { 'aria-describedby': undefined })}
        {...props}
      >
        <div className="flex flex-col gap-1.5 pr-8">
          <DialogPrimitive.Title
            className={cn('font-display text-lg font-semibold text-fg', hideTitle && 'sr-only')}
          >
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="text-sm text-fg-muted">
              {description}
            </DialogPrimitive.Description>
          ) : null}
        </div>
        {children}
        <DialogPrimitive.Close
          className={cn(
            'absolute top-4 right-4 grid size-8 place-items-center rounded-md text-fg-subtle hover:bg-surface-raised hover:text-fg',
            focusRing,
          )}
          aria-label="Close dialog"
        >
          <X aria-hidden className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}
