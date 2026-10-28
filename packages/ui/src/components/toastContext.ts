import { createContext, useContext } from 'react';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** ms; defaults to 5000. Errors default to 8000 so they can be read. */
  duration?: number;
}

export interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>.');
  return ctx;
}
