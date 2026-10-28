// Public-schema types are GENERATED from the dev database:
//   pnpm --filter @pocketnexus/database gen:types   (Supabase CLI)
// or the Supabase MCP `generate_typescript_types` tool. Do not edit them by hand.
import type { Tables } from './generated/database.types';

export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from './generated/database.types';

export type ProfileRow = Tables<'profiles'>;
export type UserPreferencesRow = Tables<'user_preferences'>;
export type DeckRow = Tables<'decks'>;
export type DeckCardRow = Tables<'deck_cards'>;
export type MatchRecordRow = Tables<'match_records'>;

export type { ArchetypeRow, CardRow, CardSetRow, DataSourceRow } from './catalog.types';
