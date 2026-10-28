import { z } from 'zod';

export const matchResultSchema = z.enum(['win', 'loss', 'draw']);
export const matchModeSchema = z.enum(['ranked', 'casual', 'event', 'practice']);

export const matchRecordInputSchema = z.object({
  deckId: z.uuid().optional(),
  opponentArchetypeId: z.uuid().optional(),
  result: matchResultSchema,
  mode: matchModeSchema,
  wentFirst: z.boolean().optional(),
  notes: z.string().trim().max(1000).optional(),
  playedAt: z.iso.datetime({ offset: true }),
});

export type MatchResult = z.infer<typeof matchResultSchema>;
export type MatchMode = z.infer<typeof matchModeSchema>;
export type MatchRecordInput = z.infer<typeof matchRecordInputSchema>;
