# Product Vision

## What PocketNexus is

An **independent, unofficial** competitive companion for Pokémon TCG Pocket players: a fast, reliable
place to look up cards, build and refine decks, log matches, and understand the metagame.

It is not affiliated with, endorsed, sponsored, or approved by Nintendo, The Pokémon Company,
Creatures Inc., GAME FREAK, or DeNA. This disclaimer appears on every page.

## Who it's for

- **Competitive grinders** who want honest numbers about their own decks and matchups.
- **Deck builders** who iterate quickly and share lists.
- **Content creators** (later phase) who need dependable overlays.

## Principles

1. **Trustworthy data.** Every competitive figure is traceable to a source and an ingestion run.
   If we don't have data, we say so — we never fill gaps with invented numbers.
2. **Fast everywhere.** Mobile-first performance budgets; nothing loads that the current page
   doesn't need.
3. **Consistent.** One design system, one navigation model, one way to do each thing.
4. **Private by default.** Profiles, decks, and match history are private unless a user chooses
   otherwise.
5. **Built to last.** Typed, tested, documented; features are added on the foundation, not patched
   on top of each other.

## What changes from V8

V8 proved demand across a wide surface (cards, decks, battles, meta, rank, teams, streaming,
training, AI coaching). It also accumulated hotfix layers, global coupling, and schema drift.
V2 rebuilds the **core loop first** (cards → decks → matches → meta), then re-adds the broader
features one at a time on the same foundation. See
[DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md).

## Non-goals (for now)

- Account linking to the game or any automated game-client integration.
- Real-money features of any kind.
- Re-hosting copyrighted card art without a reviewed source and terms.
