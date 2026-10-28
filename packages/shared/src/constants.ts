export const APP_NAME = 'PocketNexus';

/**
 * Required on every public surface. PocketNexus must never imply endorsement
 * by the rights holders of Pokémon TCG Pocket.
 */
export const UNOFFICIAL_DISCLAIMER =
  'PocketNexus is an unofficial, fan-made companion. It is not affiliated with, endorsed, ' +
  'sponsored, or approved by Nintendo, The Pokémon Company, Creatures Inc., GAME FREAK, or DeNA. ' +
  'Pokémon and Pokémon TCG Pocket are trademarks of their respective owners.';

/** Pokémon TCG Pocket deck rules used by validation. */
export const DECK_RULES = {
  size: 20,
  maxCopiesPerCard: 2,
  maxEnergyTypes: 3,
} as const;

export const APP_ENVIRONMENTS = ['development', 'staging', 'production'] as const;
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];
