import { describe, expect, it } from 'vitest';
import { signUpSchema } from './auth';
import { deckDraftSchema, validateDeckComposition } from './deck';
import { matchRecordInputSchema } from './match';

describe('signUpSchema', () => {
  const valid = {
    email: 'trainer@example.com',
    username: 'ash_k',
    password: 'pikachu12345',
    confirmPassword: 'pikachu12345',
  };

  it('accepts valid input', () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects mismatched passwords on the confirm field', () => {
    const r = signUpSchema.safeParse({ ...valid, confirmPassword: 'nope' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(['confirmPassword']);
  });

  it('rejects weak passwords and bad usernames', () => {
    expect(signUpSchema.safeParse({ ...valid, password: 'short', confirmPassword: 'short' }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, username: 'no spaces!' }).success).toBe(false);
  });
});

describe('deck validation', () => {
  it('requires exactly 20 cards', () => {
    const issues = validateDeckComposition([{ cardId: 'A1-001', quantity: 2 }]);
    expect(issues.map((i) => i.code)).toContain('size');
  });

  it('accepts a legal 20-card list', () => {
    const cards = Array.from({ length: 10 }, (_, i) => ({
      cardId: `A1-${String(i + 1).padStart(3, '0')}`,
      quantity: 2,
    }));
    expect(validateDeckComposition(cards)).toEqual([]);
  });

  it('flags duplicate entries', () => {
    const issues = validateDeckComposition([
      { cardId: 'A1-001', quantity: 1 },
      { cardId: 'A1-001', quantity: 1 },
    ]);
    expect(issues.map((i) => i.code)).toContain('duplicate_entry');
  });

  it('caps copies at the schema level', () => {
    const r = deckDraftSchema.safeParse({ name: 'Test', cards: [{ cardId: 'A1-001', quantity: 3 }] });
    expect(r.success).toBe(false);
  });
});

describe('matchRecordInputSchema', () => {
  it('requires an offset timestamp', () => {
    const base = { result: 'win', mode: 'ranked' } as const;
    expect(matchRecordInputSchema.safeParse({ ...base, playedAt: '2026-10-28T10:00:00Z' }).success).toBe(true);
    expect(matchRecordInputSchema.safeParse({ ...base, playedAt: 'yesterday' }).success).toBe(false);
  });
});
