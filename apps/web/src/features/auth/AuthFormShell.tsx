import { Card, CardContent, CardDescription, CardHeader } from '@pocketnexus/ui';
import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from './authContext';

export function AuthFormShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { state } = useAuth();
  useDocumentTitle(title);
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <h1 className="font-display text-xl font-semibold tracking-tight text-fg">{title}</h1>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {state.status === 'disabled' ? <NotConfiguredNotice reason={state.reason} /> : null}
        {children}
        {footer ? <div className="text-center text-sm text-fg-muted">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}

export function NotConfiguredNotice({ reason }: { reason: 'missing' | 'invalid' }) {
  return (
    <div
      role="note"
      className="flex gap-3 rounded-md border border-warning/30 bg-warning-soft p-3 text-sm text-warning-text"
    >
      <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p>
        {reason === 'missing'
          ? 'Accounts are not connected in this build. Forms are shown for preview only and cannot sign you in.'
          : 'The authentication configuration for this build is invalid, so accounts are disabled.'}
      </p>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-text">
      {message}
    </p>
  );
}
