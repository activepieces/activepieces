/// <reference types="vitest/globals" />

import { kickcallRowValues } from '../src/lib/common/row-values';

describe('toPartialRowValues', () => {
  test('keeps populated values and preserves surrounding whitespace', () => {
    expect(
      kickcallRowValues.toPartialRowValues({
        '10': '  hello  ',
        '11': 'world',
      }),
    ).toEqual({
      '10': '  hello  ',
      '11': 'world',
    });
  });

  test('omits null, undefined, and blank values so they stay unchanged', () => {
    expect(
      kickcallRowValues.toPartialRowValues({
        '10': 'kept',
        '11': '',
        '12': '   ',
        '13': null,
        '14': undefined,
      }),
    ).toEqual({
      '10': 'kept',
    });
  });

  test('rejects non-object values payloads', () => {
    expect(() => kickcallRowValues.toPartialRowValues([])).toThrow(/object/);
    expect(() => kickcallRowValues.toPartialRowValues('x')).toThrow(/object/);
  });
});

describe('applyClearedColumns', () => {
  test('sets selected columns to empty string without dropping other updates', () => {
    expect(
      kickcallRowValues.applyClearedColumns({
        values: { '10': 'kept', '11': 'old' },
        columnIds: ['11', 12],
      }),
    ).toEqual({
      '10': 'kept',
      '11': '',
      '12': '',
    });
  });

  test('ignores empty or invalid clear lists', () => {
    expect(
      kickcallRowValues.applyClearedColumns({
        values: { '10': 'kept' },
        columnIds: [],
      }),
    ).toEqual({ '10': 'kept' });
    expect(
      kickcallRowValues.applyClearedColumns({
        values: { '10': 'kept' },
        columnIds: undefined,
      }),
    ).toEqual({ '10': 'kept' });
  });
});
