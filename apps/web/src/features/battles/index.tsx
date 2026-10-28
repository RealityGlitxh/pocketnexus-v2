import { Swords } from 'lucide-react';
import { PlaceholderPage } from '@/components/PlaceholderPage';

export function BattlesPage() {
  return (
    <PlaceholderPage
      title="Battle Tracker"
      icon={Swords}
      phase="Phase 2"
      summary="Log your matches and see how your decks really perform."
      planned={[
        'Quick match logging (result, deck, opponent archetype, turn order)',
        'Win rate by deck and matchup, computed only from your own records',
        'Session history and notes',
        'Private by default',
      ]}
    />
  );
}
