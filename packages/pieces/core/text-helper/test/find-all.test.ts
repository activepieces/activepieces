/// <reference types="vitest/globals" />

import { findAll } from '../src/lib/actions/find-all';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('findAll action', () => {
  test('returns all plain text occurrences', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'cat and dog and cat',
        expression: 'cat',
        ignoreCase: false,
      },
    });
    expect(await findAll.run(ctx)).toEqual(['cat', 'cat']);
  });

  test('returns empty array when no match', async () => {
    const ctx = createMockActionContext({
      propsValue: { text: 'hello world', expression: 'xyz', ignoreCase: false },
    });
    expect(await findAll.run(ctx)).toEqual([]);
  });

  test('returns all regex matches', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'abc 123 def 456 ghi 789',
        expression: '\\d+',
        ignoreCase: false,
      },
    });
    expect(await findAll.run(ctx)).toEqual(['123', '456', '789']);
  });

  test('returns full match for patterns with capture groups', async () => {
    // m[0] is the full match; capture groups are intentionally not surfaced
    const ctx = createMockActionContext({
      propsValue: {
        text: 'born 1990, graduated 2012, hired 2020',
        expression: '(\\d{4})',
        ignoreCase: false,
      },
    });
    expect(await findAll.run(ctx)).toEqual(['1990', '2012', '2020']);
  });

  test('is case-sensitive by default', async () => {
    const ctx = createMockActionContext({
      propsValue: { text: 'Cat cat CAT', expression: 'cat', ignoreCase: false },
    });
    expect(await findAll.run(ctx)).toEqual(['cat']);
  });

  test('ignores case when ignoreCase is true', async () => {
    const ctx = createMockActionContext({
      propsValue: { text: 'Cat cat CAT', expression: 'cat', ignoreCase: true },
    });
    expect(await findAll.run(ctx)).toEqual(['Cat', 'cat', 'CAT']);
  });

  test('regression: returns all occurrences, not just the first match and its capture group', async () => {
    // Before the fix, find() with no g flag returned [" V0099=T700", "V0099=T700"] (first full match +
    // capture group) instead of all 4 occurrences.
    const ctx = createMockActionContext({
      propsValue: {
        text: 'codes: V0099=T700 V1234=T500 E5678=T321 G9999=T000',
        expression: '[VEG]\\d{4}=T\\d{3}',
        ignoreCase: false,
      },
    });
    const result = await findAll.run(ctx);
    expect(result).toHaveLength(4);
    expect(result).toEqual([
      'V0099=T700',
      'V1234=T500',
      'E5678=T321',
      'G9999=T000',
    ]);
  });

  test('handles a single match correctly', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        text: 'only one match here',
        expression: 'one',
        ignoreCase: false,
      },
    });
    expect(await findAll.run(ctx)).toEqual(['one']);
  });

  test('throws a descriptive error for an invalid regex', async () => {
    const ctx = createMockActionContext({
      propsValue: { text: 'hello', expression: '[unclosed', ignoreCase: false },
    });
    await expect(findAll.run(ctx)).rejects.toThrow('Invalid regular expression: [unclosed');
  });
});
