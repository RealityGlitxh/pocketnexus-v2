import {
  BarChart3,
  Layers,
  LayoutDashboard,
  Library,
  Settings,
  Swords,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

export interface NavEntry {
  readonly to: string;
  readonly label: string;
  readonly icon: LucideIcon;
  /** Matches only the exact path (used for "/"). */
  readonly end?: boolean;
  readonly status: 'placeholder' | 'available';
}

export const primaryNav: readonly NavEntry[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, status: 'placeholder' },
  { to: '/cards', label: 'Card Database', icon: Library, status: 'placeholder' },
  { to: '/decks', label: 'Deck Lab', icon: Layers, status: 'placeholder' },
  { to: '/battles', label: 'Battle Tracker', icon: Swords, status: 'placeholder' },
  { to: '/meta', label: 'Meta Center', icon: BarChart3, status: 'placeholder' },
];

export const accountNav: readonly NavEntry[] = [
  { to: '/profile', label: 'Profile', icon: UserRound, status: 'placeholder' },
  { to: '/settings', label: 'Settings', icon: Settings, status: 'available' },
];
