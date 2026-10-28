import { Layers } from 'lucide-react';
import { PlaceholderPage } from '@/components/PlaceholderPage';

export function DecksPage() {
  return (
    <PlaceholderPage
      title="Deck Lab"
      icon={Layers}
      phase="Phase 1"
      summary="Build and refine 20-card decks with live rule validation."
      planned={[
        'Deck builder with 20-card / 2-copy rule validation',
        'Saved decks synced to your account',
        'Private, unlisted, and public sharing',
        'Import and export deck codes',
      ]}
    />
  );
}
