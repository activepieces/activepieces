/// <reference types="vitest/globals" />

import { kitCommon } from '../src/lib/common/client';

describe('kitCommon.toIdList', () => {
  test.each([
    [['1', 2], [1, 2]],
    ['[3, 4]', [3, 4]],
    ['5, 6', [5, 6]],
    [7, [7]],
  ])('parses %j', (input, expected) => {
    expect(kitCommon.toIdList(input)).toEqual(expected);
  });

  test('treats empty input as unset', () => {
    expect(kitCommon.toIdList(undefined)).toBeUndefined();
    expect(kitCommon.toIdList('')).toBeUndefined();
    expect(kitCommon.toIdList([])).toBeUndefined();
  });

  test('refuses a non-numeric ID instead of dropping it', () => {
    expect(() => kitCommon.toIdList(['abc'])).toThrow('not a valid numeric ID');
    expect(() => kitCommon.toIdList('[1,')).toThrow('not a valid list of IDs');
  });
});

describe('input validation', () => {
  test('id accepts numeric strings and numbers only', () => {
    expect(kitCommon.id({ value: ' 42 ', label: 'Tag ID' })).toBe('42');
    expect(kitCommon.id({ value: 42, label: 'Tag ID' })).toBe('42');
    expect(() => kitCommon.id({ value: '42/../x', label: 'Tag ID' })).toThrow('Tag ID must be a numeric Kit ID');
    expect(() => kitCommon.id({ value: '', label: 'Tag ID' })).toThrow('Tag ID must be a numeric Kit ID');
  });

  test('page defaults to 1 and refuses 0 or fractions', () => {
    expect(kitCommon.page(undefined)).toBe(1);
    expect(kitCommon.page('3')).toBe(3);
    expect(() => kitCommon.page(0)).toThrow('Page must be a whole number');
    expect(() => kitCommon.page(1.5)).toThrow('Page must be a whole number');
  });

  test('email refuses a malformed address', () => {
    expect(kitCommon.email({ value: ' a@b.co ', label: 'Email' })).toBe('a@b.co');
    expect(() => kitCommon.email({ value: 'not-an-email', label: 'Email' })).toThrow('Email must be a valid email address');
  });

  test('toDate keeps YYYY-MM-DD and refuses anything else', () => {
    expect(kitCommon.toDate('2026-09-01T10:00:00Z')).toBe('2026-09-01');
    expect(() => kitCommon.toDate('yesterday')).toThrow('is not a valid date');
  });

  test('toDateTime refuses a past time when a future one is required', () => {
    expect(() => kitCommon.toDateTime({ value: '2000-01-01T00:00:00Z', label: 'Send At', future: true })).toThrow('Send At must be in the future');
    expect(() => kitCommon.toDateTime({ value: 'soon', label: 'Send At' })).toThrow('Send At must be an ISO 8601 date-time');
    expect(kitCommon.toDateTime({ value: '2999-01-01T00:00:00Z', label: 'Send At', future: true })).toBe('2999-01-01T00:00:00Z');
  });
});
