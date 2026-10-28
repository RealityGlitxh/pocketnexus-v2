import { describe, expect, it } from 'vitest';
import { safeReturnPath } from './safeReturnPath';

describe('safeReturnPath (open-redirect protection)', () => {
  it.each([
    [{ from: '/decks' }, '/decks'],
    [{ from: '/profile?tab=1' }, '/profile?tab=1'],
    [{ from: '//evil.example' }, '/'],
    [{ from: 'https://evil.example' }, '/'],
    [{ from: '/\\evil.example' }, '/'],
    [{ from: 42 }, '/'],
    [null, '/'],
    [undefined, '/'],
  ])('%j → %s', (state, expected) => {
    expect(safeReturnPath(state)).toBe(expected);
  });
});
