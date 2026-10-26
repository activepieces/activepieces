import { describe, expect, test } from 'vitest';
import {
  dateFromDateTime,
  failIfNothingImported,
  fromCents,
  requireDate,
  requireMonth,
  toCents,
} from '../src/lib/common/helpers';
import { validateTransactionRows } from '../src/lib/actions/import-transactions';
import { yearOptions } from '../src/lib/common/props';

describe('helpers', () => {
  test('toCents rounds decimals to integer minor units', () => {
    expect(toCents({ value: -12.5, field: 'a' })).toBe(-1250);
    expect(toCents({ value: '120.30', field: 'a' })).toBe(12030);
    expect(toCents({ value: 0.1 + 0.2, field: 'a' })).toBe(30);
    expect(() => toCents({ value: 'abc', field: 'a' })).toThrow(
      'must be a number'
    );
    expect(fromCents(-1250)).toBe(-12.5);
  });
  test('dateFromDateTime reads the leading YYYY-MM-DD (engine sends UTC ISO)', () => {
    expect(dateFromDateTime({ value: '2026-10-20', field: 'd' })).toBe(
      '2026-10-20'
    );
    expect(
      dateFromDateTime({ value: '2026-10-21T04:30:00.000Z', field: 'd' })
    ).toBe('2026-10-21');
    expect(
      dateFromDateTime({ value: '2026-10-20T00:00:00.000Z', field: 'd' })
    ).toBe('2026-10-20');
    expect(() => dateFromDateTime({ value: 'nope', field: 'd' })).toThrow();
  });
  test('date and month validation', () => {
    expect(() => requireDate({ value: '2026-02-30', field: 'd' })).toThrow(
      'real calendar date'
    );
    expect(requireMonth({ value: '2026-10', field: 'm' })).toBe('2026-10');
    expect(() => requireMonth({ value: '2026-13', field: 'm' })).toThrow();
    expect(() => requireMonth({ value: '2026-1', field: 'm' })).toThrow();
  });
  test('import errors fail only when nothing was imported', () => {
    expect(() =>
      failIfNothingImported({
        added: [],
        updated: [],
        errors: [{ message: 'Amount is invalid' }],
      })
    ).toThrow('Amount is invalid');
    expect(() =>
      failIfNothingImported({
        added: ['a'],
        updated: [],
        errors: [{ message: 'x' }],
      })
    ).not.toThrow();
    expect(() =>
      failIfNothingImported({ added: [], updated: [], errors: [] })
    ).not.toThrow();
  });
  test('bulk rows: array, date, integer cents', () => {
    expect(() => validateTransactionRows({})).toThrow('JSON array');
    expect(() => validateTransactionRows([])).toThrow('empty');
    expect(() =>
      validateTransactionRows([{ date: '2026-10-01', amount: 12.5 }])
    ).toThrow('integer in cents');
    expect(() => validateTransactionRows([{ date: '10/01/2026' }])).toThrow(
      'YYYY-MM-DD'
    );
    expect(
      validateTransactionRows([{ date: '2026-10-01', amount: -1250 }])
    ).toHaveLength(1);
  });
  test('year options are computed from the current date', () => {
    const years = yearOptions(new Date('2031-06-01T00:00:00Z')).map(
      (o) => o.value
    );
    expect(years[0]).toBe('2036');
    expect(years).toContain('2011');
  });
});
