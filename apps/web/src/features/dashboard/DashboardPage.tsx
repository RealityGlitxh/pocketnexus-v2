import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@pocketnexus/ui';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { primaryNav } from '@/routes/navigation';
import { SystemStatus } from './SystemStatus';

const moduleBlurbs: Record<string, string> = {
  '/cards': 'Search and filter the full card catalog.',
  '/decks': 'Build, validate, and save decks.',
  '/battles': 'Log matches and review your results.',
  '/meta': 'Archetype trends from verified sources.',
};

/**
 * Phase 0 dashboard. Shows only real information (build environment and
 * live configured / reachable / authenticated checks). It deliberately contains no statistics: there is no
 * data source yet and placeholders must never look like live data.
 */
export function DashboardPage() {
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

      <SystemStatus />
    </div>
  );
}
