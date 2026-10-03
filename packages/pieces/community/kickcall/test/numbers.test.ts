/// <reference types="vitest/globals" />

import { kickcallNumbers } from '../src/lib/common/numbers';

describe('parsePositiveInteger', () => {
  test('accepts numbers and numeric strings from expressions', () => {
    expect(
      kickcallNumbers.parsePositiveInteger({
        value: 10,
        fieldName: 'Limit',
        maximum: 1000,
      }),
    ).toBe(10);
    expect(
      kickcallNumbers.parsePositiveInteger({
        value: '10',
        fieldName: 'Limit',
        maximum: 1000,
      }),
    ).toBe(10);
    expect(
      kickcallNumbers.parsePositiveInteger({
        value: ' 2 ',
        fieldName: 'Page',
      }),
    ).toBe(2);
  });

  test('uses fallback for empty values and floors decimals', () => {
    expect(
      kickcallNumbers.parsePositiveInteger({
        value: undefined,
        fallback: 1,
        fieldName: 'Page',
      }),
    ).toBe(1);
    expect(
      kickcallNumbers.parsePositiveInteger({
        value: 2.9,
        fieldName: 'Page',
      }),
    ).toBe(2);
  });

  test('rejects invalid and out-of-range values instead of coercing silently', () => {
    expect(() =>
      kickcallNumbers.parsePositiveInteger({
        value: 'abc',
        fallback: 1,
        fieldName: 'Page',
      }),
    ).toThrow(/Page must be a number/);
    expect(() =>
      kickcallNumbers.parsePositiveInteger({
        value: '0',
        fieldName: 'Limit',
        maximum: 1000,
      }),
    ).toThrow(/greater than or equal to 1/);
    expect(() =>
      kickcallNumbers.parsePositiveInteger({
        value: '1001',
        fieldName: 'Limit',
        maximum: 1000,
      }),
    ).toThrow(/at most 1000/);
  });
});
