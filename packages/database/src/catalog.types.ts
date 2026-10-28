/**
 * Row types for the read-only `catalog` schema.
 *
 * Hand-maintained because Supabase type generation currently covers the
 * `public` schema only. Keep in sync with
 * supabase/migrations/*_catalog.sql. Clients never write to these tables.
 */
import type { Json } from './generated/database.types';

interface Timestamps {
  created_at: string;
  updated_at: string;
}

export interface DataSourceRow extends Timestamps {
  id: string;
  slug: string;
  name: string;
  kind: 'card_catalog' | 'tournament_results' | 'meta_snapshot' | 'manual';
  base_url: string | null;
  terms_url: string | null;
  attribution: string | null;
  is_active: boolean;
  notes: string | null;
}

export interface CardSetRow extends Timestamps {
  id: string;
  name: string;
  series: string | null;
  release_date: string | null;
  card_count: number | null;
  source_id: string | null;
}

export interface CardRow extends Timestamps {
  id: string;
  set_id: string;
  number: string;
  name: string;
  supertype: 'pokemon' | 'trainer' | 'energy';
  subtype: string | null;
  energy_type: string | null;
  rarity: string | null;
  hp: number | null;
  is_ex: boolean;
  image_path: string | null;
  attributes: Json;
  source_id: string | null;
}

export interface ArchetypeRow extends Timestamps {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  key_card_ids: string[];
  is_active: boolean;
  source_id: string | null;
}
