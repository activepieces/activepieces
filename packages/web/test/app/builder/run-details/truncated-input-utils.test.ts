import { describe, expect, it } from 'vitest';

import { truncatedInputUtils } from '@/app/builder/run-details/truncated-input-utils';

describe('truncatedInputUtils.hasTruncatedValues', () => {
  it('detects the KB placeholder', () => {
    expect(
      truncatedInputUtils.hasTruncatedValues({
        conversation_parts: '(truncated, original size 68 KB)',
        other: 'value',
      }),
    ).toBe(true);
  });

  it('detects the MB placeholder', () => {
    expect(
      truncatedInputUtils.hasTruncatedValues({
        payload: '(truncated, original size 3.4 MB)',
      }),
    ).toBe(true);
  });

  it('ignores inputs without the placeholder', () => {
    expect(
      truncatedInputUtils.hasTruncatedValues({
        conversation_parts: [{ id: 1 }],
        note: 'contains the word truncated but is user data',
      }),
    ).toBe(false);
  });

  it('detects the legacy bare placeholder from pre-slicing runs', () => {
    expect(
      truncatedInputUtils.hasTruncatedValues({ payload: '(truncated)' }),
    ).toBe(true);
  });

  it('ignores near-miss strings', () => {
    expect(
      truncatedInputUtils.hasTruncatedValues({
        b: 'prefix (truncated, original size 68 KB)',
        c: '(truncated, original size huge KB)',
        d: '(truncated, original size 68 KB) suffix',
      }),
    ).toBe(false);
  });

  it('handles non-record inputs', () => {
    expect(truncatedInputUtils.hasTruncatedValues(undefined)).toBe(false);
    expect(truncatedInputUtils.hasTruncatedValues(null)).toBe(false);
    expect(truncatedInputUtils.hasTruncatedValues('a string')).toBe(false);
    expect(truncatedInputUtils.hasTruncatedValues([])).toBe(false);
    expect(truncatedInputUtils.hasTruncatedValues({})).toBe(false);
  });
});
