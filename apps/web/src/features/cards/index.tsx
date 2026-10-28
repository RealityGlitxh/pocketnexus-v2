import { Library } from 'lucide-react';
import { PlaceholderPage } from '@/components/PlaceholderPage';

export function CardsPage() {
  return (
    <PlaceholderPage
      title="Card Database"
      icon={Library}
      phase="Phase 1"
      summary="Browse every card in Pokémon TCG Pocket with fast search and filters."
      planned={[
        'Server-side search with pagination (never loads the full catalog up front)',
        'Filters for set, type, rarity, and stage',
        'Card detail view with attacks, abilities, and set info',
        'Catalog sourced through the audited ingestion pipeline',
      ]}
    />
  );
}
