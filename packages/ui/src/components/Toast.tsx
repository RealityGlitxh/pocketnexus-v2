import * as ToastPrimitive from '@radix-ui/react-toast';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cn, focusRing } from '../lib/cn';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** ms; defaults to 5000. Errors default to 8000 so they can be read. */
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, 'title' | 'tone' | 'duration'>> {
  id: number;
  description: string | undefined;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: 'text-accent-text' },
  success: { icon: CheckCircle2, className: 'text-success-text' },
  warning: { icon: AlertTriangle, className: 'text-warning-text' },
  danger: { icon: XCircle, className: 'text-danger-text' },
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const tone = options.tone ?? 'info';
    nextId += 1;
    const item: ToastItem = {
      id: nextId,
      title: options.title,
      description: options.description,
      tone,
      duration: options.duration ?? (tone === 'danger' ? 8000 : 5000),
    };
    // Cap visible toasts so a burst of errors can't flood the screen.
    setItems((prev) => [...prev.slice(-3), item]);
  }, []);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {items.map((item) => {
          const { icon: Icon, className } = toneStyles[item.tone];
          return (
            <ToastPrimitive.Root
              key={item.id}
              duration={item.duration}
              type={item.tone === 'danger' ? 'foreground' : 'background'}
              onOpenChange={(open) => {
                if (!open) remove(item.id);
              }}
              className={cn(
                'pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-border bg-surface-overlay p-4 shadow-lg',
                'data-[state=open]:animate-fade-in data-[swipe=end]:translate-x-full data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x)',
              )}
            >
              <Icon aria-hidden className={cn('mt-0.5 size-5 shrink-0', className)} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <ToastPrimitive.Title className="text-sm font-semibold text-fg">
                  {item.title}
                </ToastPrimitive.Title>
                {item.description ? (
                  <ToastPrimitive.Description className="text-sm text-fg-muted">
                    {item.description}
                  </ToastPrimitive.Description>
                ) : null}
              </div>
              <ToastPrimitive.Close
                aria-label="Dismiss notification"
                className={cn(
                  'grid size-6 place-items-center rounded-sm text-fg-subtle hover:text-fg',
                  focusRing,
                )}
              >
                <X aria-hidden className="size-4" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
        <ToastPrimitive.Viewport className="fixed right-0 bottom-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>.');
  return ctx;
}
