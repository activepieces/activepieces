import { describe, expect, test } from 'vitest';
import { squareIdempotency } from '../src/lib/common/idempotency';
import { squareInputs } from '../src/lib/common/inputs';
import { squareMoney } from '../src/lib/common/money';

describe('money', () => {
  test.each([
    ['12.50', 'USD', 1250],
    ['12.5', 'USD', 1250],
    ['0.10', 'USD', 10],
    ['19.99', 'USD', 1999],
    ['12.500', 'USD', 1250],
    ['1000', 'JPY', 1000],
    ['1000.0', 'JPY', 1000],
    ['4.35', 'EUR', 435],
    [0.29, 'USD', 29],
    [1.005, 'USD', null],
  ])('%s %s -> %s', (amount, currency, expected) => {
    if (expected === null) {
      expect(() => squareMoney.toMinor({ amount, currency, label: 'Amount' })).toThrow('more decimal places');
    } else {
      expect(squareMoney.toMinor({ amount, currency, label: 'Amount' })).toBe(expected);
    }
  });

  test('rejects bad amounts', () => {
    expect(() => squareMoney.toMinor({ amount: '-1', currency: 'USD', label: 'Amount' })).toThrow('not a valid amount');
    expect(() => squareMoney.toMinor({ amount: '$5', currency: 'USD', label: 'Amount' })).toThrow('not a valid amount');
    expect(() => squareMoney.toMinor({ amount: '10.5', currency: 'JPY', label: 'Amount' })).toThrow('more decimal places');
    expect(() => squareMoney.toMinor({ amount: '0', currency: 'USD', label: 'Amount' })).toThrow('greater than zero');
    expect(squareMoney.toMinor({ amount: '0', currency: 'USD', label: 'Amount', allowZero: true })).toBe(0);
    expect(() => squareMoney.toMinor({ amount: '99999999999999999', currency: 'USD', label: 'Amount' })).toThrow('too large');
    expect(() => squareMoney.toMinor({ amount: '', currency: 'USD', label: 'Amount' })).toThrow('required');
  });

  test('formats minor units with string math', () => {
    expect(squareMoney.format({ minor: 1250, currency: 'USD' })).toBe('12.50');
    expect(squareMoney.format({ minor: 5, currency: 'USD' })).toBe('0.05');
    expect(squareMoney.format({ minor: -1999, currency: 'USD' })).toBe('-19.99');
    expect(squareMoney.format({ minor: 1000, currency: 'JPY' })).toBe('1000');
    expect(squareMoney.format({ minor: 9007199254740991, currency: 'USD' })).toBe('90071992547409.91');
  });

  test('normalizes currency codes', () => {
    expect(squareMoney.normalizeCurrency(' usd ')).toBe('USD');
    expect(squareMoney.normalizeCurrency('')).toBeUndefined();
    expect(() => squareMoney.normalizeCurrency('dollars')).toThrow('3-letter');
  });

  test('quantities', () => {
    expect(squareMoney.quantity({ value: '2', label: 'Q' })).toBe('2');
    expect(squareMoney.quantity({ value: '1.50', label: 'Q' })).toBe('1.5');
    expect(squareMoney.quantity({ value: 3, label: 'Q', wholeOnly: true })).toBe('3');
    expect(() => squareMoney.quantity({ value: '1.5', label: 'Q', wholeOnly: true })).toThrow('whole number');
    expect(() => squareMoney.quantity({ value: '0', label: 'Q' })).toThrow('greater than zero');
    expect(squareMoney.quantity({ value: '0', label: 'Q', allowZero: true })).toBe('0');
    expect(() => squareMoney.quantity({ value: '-2', label: 'Q' })).toThrow('not a valid quantity');
  });
});

describe('idempotency keys', () => {
  const base = { custom: undefined, runId: 'run-1', stepName: 'step_1', action: 'refund_payment', input: { a: 1, b: { c: 2 } } };

  test('same run, step, action and input give the same key', () => {
    const first = squareIdempotency.key(base);
    expect(first).toHaveLength(40);
    expect(squareIdempotency.key({ ...base, input: { b: { c: 2 }, a: 1 } })).toBe(first);
  });

  test('a different run, step or input gives a new key', () => {
    const first = squareIdempotency.key(base);
    expect(squareIdempotency.key({ ...base, runId: 'run-2' })).not.toBe(first);
    expect(squareIdempotency.key({ ...base, stepName: 'step_2' })).not.toBe(first);
    expect(squareIdempotency.key({ ...base, input: { a: 2, b: { c: 2 } } })).not.toBe(first);
  });

  test('custom keys win and are length checked', () => {
    expect(squareIdempotency.key({ ...base, custom: ' my-key ' })).toBe('my-key');
    expect(() => squareIdempotency.key({ ...base, custom: 'x'.repeat(46) })).toThrow('at most 45');
  });

  test('without a run id each call is unique', () => {
    expect(squareIdempotency.key({ ...base, runId: undefined })).not.toBe(squareIdempotency.key({ ...base, runId: undefined }));
  });
});

describe('inputs', () => {
  test('ids reject path tricks', () => {
    expect(squareInputs.requireId({ value: ' ABC ', label: 'ID' })).toBe('ABC');
    expect(() => squareInputs.requireId({ value: '../x', label: 'ID' })).toThrow('not a valid Square ID');
    expect(() => squareInputs.requireId({ value: 'a?b', label: 'ID' })).toThrow('not a valid Square ID');
    expect(() => squareInputs.requireId({ value: '', label: 'ID' })).toThrow('required');
  });

  test('limits clamp to the endpoint max', () => {
    expect(squareInputs.limit({ value: undefined, fallback: 50, max: 100 })).toBe(50);
    expect(squareInputs.limit({ value: 500, fallback: 50, max: 100 })).toBe(100);
    expect(squareInputs.limit({ value: '7', fallback: 50, max: 100 })).toBe(7);
    expect(() => squareInputs.limit({ value: 0, fallback: 50, max: 100 })).toThrow('whole number');
  });

  test('dates', () => {
    expect(squareInputs.dateTime({ value: '2026-10-07T10:00:00+02:00', label: 'D' })).toBe('2026-10-07T08:00:00.000Z');
    expect(() => squareInputs.dateTime({ value: 'soon', label: 'D' })).toThrow('not a valid date');
    expect(squareInputs.dateOnly({ value: '2026-11-30', label: 'D' })).toBe('2026-11-30');
    expect(squareInputs.idList({ value: 'A, B,A', label: 'IDs', max: 5 })).toEqual(['A', 'B']);
    expect(() => squareInputs.idList({ value: ['A', 'B', 'C'], label: 'IDs', max: 2 })).toThrow('at most 2');
  });
});
