import { Badge, Card, CardContent, CardDescription, CardHeader, cn } from '@pocketnexus/ui';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, MinusCircle, XCircle, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { env } from '@/lib/env';
import { checkBackendHealth } from '@/services/health.service';
import { deriveIndicators, type CheckStatus, type HealthInput, type Indicator } from './statusIndicators';

const statusUi: Record<CheckStatus, { icon: LucideIcon; text: string; className: string }> = {
  ok: { icon: CheckCircle2, text: 'OK', className: 'text-success-text' },
  pending: { icon: Loader2, text: 'Checking', className: 'animate-spin text-fg-subtle' },
  failed: { icon: XCircle, text: 'Failed', className: 'text-danger-text' },
  skipped: { icon: MinusCircle, text: 'Not checked', className: 'text-fg-subtle' },
};

function StatusItem({ status, label, detail }: Indicator) {
  const { icon: Icon, text, className } = statusUi[status];
  return (
    <li className="flex items-start gap-3">
      <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', className)} />
      <div className="min-w-0">
        {/* Status is spelled out in text, never conveyed by color alone. */}
        <p className="text-sm font-medium text-fg">
          {label}: <span className="font-normal text-fg-muted">{text}</span>
        </p>
        <p className="text-xs text-fg-muted">{detail}</p>
      </div>
    </li>
  );
}

export function SystemStatus() {
  const { state } = useAuth();
  const configured = env.supabase.status === 'configured';

  const health = useQuery({
    queryKey: ['system', 'backend-health'],
    queryFn: () => checkBackendHealth(),
    enabled: configured,
    staleTime: 60_000,
    retry: false,
  });

  let healthInput: HealthInput = null;
  if (configured) {
    if (health.isPending) healthInput = { status: 'pending' };
    else if (health.data?.ok) healthInput = { status: 'ok', latencyMs: health.data.value.latencyMs };
    else
      healthInput = {
        status: 'failed',
        message: health.data && !health.data.ok ? health.data.error.message : 'The backend could not be reached.',
      };
  }

  const indicators = deriveIndicators({ configStatus: env.supabase.status, health: healthInput, auth: state });

  return (
    <section aria-labelledby="status-heading">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="status-heading" className="text-base font-semibold text-fg">
              System status
            </h2>
            <Badge tone="neutral">{env.appEnv}</Badge>
          </div>
          <CardDescription>Live checks for this build — not sample data.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul aria-live="polite" className="grid gap-4 sm:grid-cols-3">
            {indicators.map((i) => (
              <StatusItem key={i.label} {...i} />
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
