import { z } from 'zod';
import { DECK_RULES } from '../constants';

/** Card catalog identifier, e.g. "A1-001". Format mirrors the DB check constraint. */
export const cardIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9]{1,8}-[A-Za-z0-9]{1,8}$/, 'Invalid card identifier.');

export const deckCardSchema = z.object({
  cardId: cardIdSchema,
  quantity: z.number().int().min(1).max(DECK_RULES.maxCopiesPerCard),
});

export const deckDraftSchema = z.object({
  name: z.string().trim().min(1, 'Give your deck a name.').max(60),
  description: z.string().trim().max(500).optional(),
  visibility: z.enum(['private', 'unlisted', 'public']).default('private'),
  cards: z.array(deckCardSchema).max(DECK_RULES.size),
});

export type DeckCardInput = z.infer<typeof deckCardSchema>;
export type DeckDraftInput = z.infer<typeof deckDraftSchema>;

export interface DeckValidationIssue {
  readonly code: 'size' | 'duplicate_entry' | 'too_many_copies';
  readonly message: string;
}

/**
 * Validates Pocket deck-construction rules that need the whole list. Energy
 * type limits need card metadata and are validated once the catalog exists.
 */
export function validateDeckComposition(
  cards: readonly DeckCardInput[],
): readonly DeckValidationIssue[] {
  const issues: DeckValidationIssue[] = [];
  const seen = new Set<string>();
  let total = 0;
  for (const card of cards) {
    if (seen.has(card.cardId)) {
      issues.push({ code: 'duplicate_entry', message: `${card.cardId} is listed more than once.` });
    }
    seen.add(card.cardId);
    if (card.quantity > DECK_RULES.maxCopiesPerCard) {
      issues.push({
        code: 'too_many_copies',
        message: `${card.cardId} exceeds ${DECK_RULES.maxCopiesPerCard} copies.`,
      });
    }
    total += card.quantity;
  }
  if (total !== DECK_RULES.size) {
    issues.push({
      code: 'size',
      message: `Decks must contain exactly ${DECK_RULES.size} cards (currently ${total}).`,
    });
  }
  return issues;
}
