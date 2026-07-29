// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { matchesPieceSearch } from './piece-set-pieces-tab';

const humanInput = {
  displayName: 'Human Input',
  name: '@activepieces/piece-forms',
};

describe('matchesPieceSearch', () => {
  it('matches on the package name', () => {
    expect(matchesPieceSearch(humanInput, '@activepieces/piece-forms')).toBe(
      true
    );
    expect(matchesPieceSearch(humanInput, 'piece-forms')).toBe(true);
  });

  it('matches on the display name', () => {
    expect(matchesPieceSearch(humanInput, 'Human Input')).toBe(true);
    expect(matchesPieceSearch(humanInput, 'human')).toBe(true);
  });

  it('ignores case and surrounding whitespace', () => {
    expect(matchesPieceSearch(humanInput, '  PIECE-FORMS  ')).toBe(true);
  });

  it('keeps every piece when the search is empty', () => {
    expect(matchesPieceSearch(humanInput, '')).toBe(true);
    expect(matchesPieceSearch(humanInput, '   ')).toBe(true);
  });

  it('does not match unrelated searches', () => {
    expect(matchesPieceSearch(humanInput, 'slack')).toBe(false);
  });
});
