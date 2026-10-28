import { BarChart3 } from 'lucide-react';
import { PlaceholderPage } from '@/components/PlaceholderPage';

export function MetaPage() {
  return (
    <PlaceholderPage
      title="Meta Center"
      icon={BarChart3}
      phase="Phase 2"
      summary="Competitive archetype trends built from verified, attributed sources."
      planned={[
        'Archetype library with key cards',
        'Usage and performance trends over selectable time windows',
        'Every figure linked to its source and ingestion run',
        'No figures are shown until a reviewed data source is connected',
      ]}
    />
  );
}
