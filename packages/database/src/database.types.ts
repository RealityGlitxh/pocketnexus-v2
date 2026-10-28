/**
 * Hand-maintained Supabase types matching supabase/migrations (Phase 0).
 *
 * Replace with generated types once the Supabase CLI is available:
 *   pnpm --filter @pocketnexus/database gen:types
 * then re-export from ./generated/database.types. The shape below follows the
 * CLI's output format so the swap is mechanical.
 *
 * The `ingest` schema is intentionally absent: it is never exposed to clients.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string; updated_at: string };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          avatar_path: string | null;
          visibility: 'private' | 'public';
        } & Timestamps;
        Insert: never; // created by trigger on auth.users
        Update: {
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_path?: string | null;
          visibility?: 'private' | 'public';
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          theme: 'dark' | 'light' | 'system';
          reduced_motion: boolean;
          locale: string;
        } & Timestamps;
        Insert: never; // created by trigger on auth.users
        Update: {
          theme?: 'dark' | 'light' | 'system';
          reduced_motion?: boolean;
          locale?: string;
        };
        Relationships: [];
      };
      decks: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          visibility: 'private' | 'unlisted' | 'public';
          archetype_id: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          visibility?: 'private' | 'unlisted' | 'public';
          archetype_id?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          visibility?: 'private' | 'unlisted' | 'public';
          archetype_id?: string | null;
        };
        Relationships: [];
      };
      deck_cards: {
        Row: { deck_id: string; card_id: string; quantity: number; created_at: string };
        Insert: { deck_id: string; card_id: string; quantity: number };
        Update: { quantity?: number };
        Relationships: [];
      };
      match_records: {
        Row: {
          id: string;
          owner_id: string;
          deck_id: string | null;
          opponent_archetype_id: string | null;
          result: 'win' | 'loss' | 'draw';
          mode: 'ranked' | 'casual' | 'event' | 'practice';
          went_first: boolean | null;
          notes: string | null;
          played_at: string;
        } & Timestamps;
        Insert: {
          id?: string;
          owner_id: string;
          deck_id?: string | null;
          opponent_archetype_id?: string | null;
          result: 'win' | 'loss' | 'draw';
          mode: 'ranked' | 'casual' | 'event' | 'practice';
          went_first?: boolean | null;
          notes?: string | null;
          played_at: string;
        };
        Update: {
          deck_id?: string | null;
          opponent_archetype_id?: string | null;
          result?: 'win' | 'loss' | 'draw';
          mode?: 'ranked' | 'casual' | 'event' | 'practice';
          went_first?: boolean | null;
          notes?: string | null;
          played_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      get_shared_deck: {
        Args: { p_deck_id: string };
        Returns: {
          id: string;
          name: string;
          description: string | null;
          visibility: 'private' | 'unlisted' | 'public';
          archetype_id: string | null;
          owner_username: string | null;
          updated_at: string;
          cards: Json;
        }[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  catalog: {
    Tables: {
      data_sources: {
        Row: {
          id: string;
          slug: string;
          name: string;
          kind: 'card_catalog' | 'tournament_results' | 'meta_snapshot' | 'manual';
          base_url: string | null;
          terms_url: string | null;
          attribution: string | null;
          is_active: boolean;
          notes: string | null;
        } & Timestamps;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      card_sets: {
        Row: {
          id: string;
          name: string;
          series: string | null;
          release_date: string | null;
          card_count: number | null;
          source_id: string | null;
        } & Timestamps;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      cards: {
        Row: {
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
        } & Timestamps;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      archetypes: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          key_card_ids: string[];
          is_active: boolean;
          source_id: string | null;
        } & Timestamps;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

type PublicTables = Database['public']['Tables'];

export type Tables<T extends keyof PublicTables> = PublicTables[T]['Row'];
export type TablesInsert<T extends keyof PublicTables> = PublicTables[T]['Insert'];
export type TablesUpdate<T extends keyof PublicTables> = PublicTables[T]['Update'];

export type ProfileRow = Tables<'profiles'>;
export type UserPreferencesRow = Tables<'user_preferences'>;
export type DeckRow = Tables<'decks'>;
export type DeckCardRow = Tables<'deck_cards'>;
export type MatchRecordRow = Tables<'match_records'>;
export type CardRow = Database['catalog']['Tables']['cards']['Row'];
export type CardSetRow = Database['catalog']['Tables']['card_sets']['Row'];
export type ArchetypeRow = Database['catalog']['Tables']['archetypes']['Row'];
export type DataSourceRow = Database['catalog']['Tables']['data_sources']['Row'];
