import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@pocketnexus/ui';
import { ArrowRight, CheckCircle2, CircleDashed } from 'lucide-react';
import { Link } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/features/auth';
import { env } from '@/lib/env';
import { primaryNav } from '@/routes/navigation';

const moduleBlurbs: Record<string, string> = {
  '/cards': 'Search and filter the full card catalog.',
  '/decks': 'Build, validate, and save decks.',
  '/battles': 'Log matches and review your results.',
  '/meta': 'Archetype trends from verified sources.',
};

function StatusRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  const Icon = ok ? CheckCircle2 : CircleDashed;
  return (
    <li className="flex items-start gap-3">
      <Icon aria-hidden className={ok ? 'mt-0.5 size-4 text-success-text' : 'mt-0.5 size-4 text-fg-subtle'} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg">{label}</p>
        <p className="text-xs text-fg-muted">{detail}</p>
      </div>
    </li>
  );
}

/**
 * Phase 0 dashboard. Shows only real information (build environment and
 * connection status). It deliberately contains no statistics: there is no
 * data source yet and placeholders must never look like live data.
 */
export function DashboardPage() {
  const { state } = useAuth();
  const supabaseOk = env.supabase.status === 'configured';
  const authDetail: Record<typeof state.status, string> = {
    disabled: 'Not configured for this build',
    loading: 'Checking session…',
    error: 'Authentication service unreachable',
    signed_out: 'Ready — you are signed out',
    signed_in: 'Signed in',
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Your competitive hub for Pokémon TCG Pocket. PocketNexus 2.0 is being rebuilt from the ground up — modules come online as they're finished."
        badge={<Badge tone="warning">Foundation preview</Badge>}
      />

      <section aria-labelledby="modules-heading" className="flex flex-col gap-4">
        <h2 id="modules-heading" className="text-lg font-semibold text-fg">
          Modules
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {primaryNav
            .filter((n) => n.to !== '/')
            .map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Card className="group h-full transition-colors hover:border-border-strong">
                  <CardHeader className="flex-row items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-text">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <CardTitle className="flex items-center gap-2">
                        {label}
                        <Badge>Planned</Badge>
                      </CardTitle>
                      <CardDescription>{moduleBlurbs[to]}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="link" size="sm">
                      <Link to={to}>
                        View status <ArrowRight aria-hidden />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
        </ul>
      </section>

      <section aria-labelledby="status-heading">
        <Card>
          <CardHeader>
            <h2 id="status-heading" className="text-base font-semibold text-fg">
              System status
            </h2>
            <CardDescription>Live configuration of this build — not sample data.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-4 sm:grid-cols-3">
              <StatusRow ok label="Environment" detail={env.appEnv} />
              <StatusRow
                ok={supabaseOk}
                label="Backend"
                detail={supabaseOk ? 'Development Supabase connected' : 'Not connected'}
              />
              <StatusRow ok={state.status === 'signed_in' || state.status === 'signed_out'} label="Accounts" detail={authDetail[state.status]} />
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
