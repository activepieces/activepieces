import { describe, expect, test } from 'vitest';
import { SquareApiError } from '../src/lib/common/client';
import { squareIdempotency } from '../src/lib/common/idempotency';
import { memoryStore, sharedContext } from './helpers';
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
  const rejected = () => new SquareApiError({ operation: 'x', status: 400, responseBody: { errors: [{ code: 'BAD_REQUEST' }] } });
  const lost = () => new SquareApiError({ operation: 'x', status: 502, responseBody: 'bad gateway' });
  const input = { a: 1, b: { c: 2 } };

  async function attempt({ store, fail, propsValue = {}, value = input }: { store: ReturnType<typeof memoryStore>; fail?: () => Error; propsValue?: Record<string, unknown>; value?: unknown }) {
    const keys: string[] = [];
    const run = squareIdempotency.execute({
      context: sharedContext({ propsValue, store }),
      action: 'record_external_payment',
      input: value,
      send: async ({ idempotencyKey }) => {
        keys.push(idempotencyKey);
        if (fail) {
          throw fail();
        }
        return idempotencyKey;
      },
    });
    await run.catch(() => undefined);
    return keys[0];
  }

  test('loop iterations with the same input get different keys', async () => {
    const store = memoryStore();
    const first = await attempt({ store });
    const second = await attempt({ store });
    expect(first).not.toBe(second);
    expect(first.length).toBeLessThanOrEqual(45);
  });

  test('a retry after a lost response reuses the key, then the next iteration gets a new one', async () => {
    const store = memoryStore();
    const failed = await attempt({ store, fail: lost });
    const retried = await attempt({ store });
    const next = await attempt({ store });
    expect(retried).toBe(failed);
    expect(next).not.toBe(failed);
  });

  test('a definite rejection frees the key', async () => {
    const store = memoryStore();
    const failed = await attempt({ store, fail: rejected });
    expect(await attempt({ store })).not.toBe(failed);
  });

  test('a different input does not reuse a pending key', async () => {
    const store = memoryStore();
    const failed = await attempt({ store, fail: lost });
    expect(await attempt({ store, value: { a: 2 } })).not.toBe(failed);
    expect(squareIdempotency.canonical({ b: { c: 2 }, a: 1 })).toBe(squareIdempotency.canonical(input));
  });

  test('custom keys win and are length checked', async () => {
    const store = memoryStore();
    expect(await attempt({ store, propsValue: { idempotency_key: ' my-key ' } })).toBe('my-key');
    expect(await attempt({ store, propsValue: { idempotency_key: ' my-key ' } })).toBe('my-key');
    expect(() => squareIdempotency.customKey({ value: 'x'.repeat(46) })).toThrow('at most 45');
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
