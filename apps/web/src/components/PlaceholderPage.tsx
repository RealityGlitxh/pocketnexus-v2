import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from '@pocketnexus/ui';
import { Construction, type LucideIcon } from 'lucide-react';
import { PageHeader } from './PageHeader';

export interface PlaceholderPageProps {
  title: string;
  summary: string;
  icon: LucideIcon;
  /** Planned capabilities — described as plans, never as working features. */
  planned: readonly string[];
  phase: string;
}

/**
 * Standard "not built yet" page. Every unfinished route uses this so
 * unfinished work is always clearly labelled and never shows invented data.
 */
export function PlaceholderPage({ title, summary, icon, planned, phase }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={title}
        description={summary}
        badge={<Badge tone="warning">In development</Badge>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <EmptyState
          icon={icon}
          title={`${title} isn't built yet`}
          description={`This section is a placeholder in the Phase 0 foundation. It is scheduled for ${phase}. No data shown here is real.`}
          className="min-h-72"
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Construction aria-hidden className="size-4 text-warning-text" />
              Planned for this section
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-fg-muted marker:text-fg-subtle">
              {planned.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
