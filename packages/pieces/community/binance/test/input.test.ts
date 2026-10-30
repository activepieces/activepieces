import { describe, expect, it } from 'vitest';
import { binanceInput } from '../src/lib/common/input';

describe('symbol normalisation', () => {
  it.each([
    ['BTCUSDT', 'BTCUSDT'],
    ['btcusdt', 'BTCUSDT'],
    ['BTC/USDT', 'BTCUSDT'],
    [' btc / usdt ', 'BTCUSDT'],
    ['B T C\tUSDT\n', 'BTCUSDT'],
    ['BTC//USDT', 'BTCUSDT'],
    ['币安人生usdt', '币安人生USDT'],
    ['abc-def_g.h', 'ABC-DEF_G.H'],
  ])('%j -> %s', (input, expected) => {
    expect(binanceInput.symbol({ value: input })).toBe(expected);
  });

  it('rejects empty, whitespace-only and non-text values', () => {
    expect(() => binanceInput.symbol({ value: '' })).toThrow('Symbol is required');
    expect(() => binanceInput.symbol({ value: ' / \n' })).toThrow('Symbol is required');
    expect(() => binanceInput.symbol({ value: undefined })).toThrow('Symbol is required');
    expect(() => binanceInput.symbol({ value: { a: 1 } })).toThrow('Symbol is required');
    expect(() => binanceInput.symbol({ value: '', fieldName: 'First Coin Symbol' })).toThrow('First Coin Symbol is required');
  });

  it('rejects symbols longer than Binance allows', () => {
    expect(() => binanceInput.symbol({ value: 'A'.repeat(51) })).toThrow('longer than 50');
    expect(binanceInput.symbol({ value: 'A'.repeat(50) })).toHaveLength(50);
  });
});

describe('symbol lists', () => {
  it('normalises, splits comma lists and dedupes in order', () => {
    expect(binanceInput.symbols({ value: ['btc usdt', 'ETHUSDT', 'BTC/USDT', 'BNBUSDT, solusdt\nXRPUSDT'] })).toEqual([
      'BTCUSDT',
      'ETHUSDT',
      'BNBUSDT',
      'SOLUSDT',
      'XRPUSDT',
    ]);
  });

  it('accepts one comma-separated string', () => {
    expect(binanceInput.symbols({ value: 'BTCUSDT,ETHUSDT' })).toEqual(['BTCUSDT', 'ETHUSDT']);
  });

  it('rejects an empty list and lists over 100 unique symbols', () => {
    expect(() => binanceInput.symbols({ value: [] })).toThrow('at least one symbol');
    expect(() => binanceInput.symbols({ value: ['', ' , '] })).toThrow('at least one symbol');
    const hundred = Array.from({ length: 100 }, (_, i) => `S${i}USDT`);
    expect(binanceInput.symbols({ value: [...hundred, 'S0USDT'] })).toHaveLength(100);
    expect(() => binanceInput.symbols({ value: [...hundred, 'EXTRAUSDT'] })).toThrow('at most 100 symbols');
  });

  it('rejects non-text items', () => {
    expect(() => binanceInput.symbols({ value: [{ symbol: 'BTCUSDT' }] })).toThrow('text values');
  });
});

describe('limits', () => {
  const bounds = { min: 1, max: 1000, defaultValue: 50 };
  it('defaults when empty', () => {
    expect(binanceInput.limit({ value: undefined, ...bounds })).toBe(50);
    expect(binanceInput.limit({ value: null, ...bounds })).toBe(50);
    expect(binanceInput.limit({ value: '', ...bounds })).toBe(50);
  });
  it('accepts integers and numeric strings at the bounds', () => {
    expect(binanceInput.limit({ value: 1, ...bounds })).toBe(1);
    expect(binanceInput.limit({ value: '1000', ...bounds })).toBe(1000);
    expect(binanceInput.limit({ value: ' 20 ', ...bounds })).toBe(20);
  });
  it('rejects out-of-range, fractional and non-numeric values', () => {
    expect(() => binanceInput.limit({ value: 0, ...bounds })).toThrow('between 1 and 1000; got 0');
    expect(() => binanceInput.limit({ value: 1001, ...bounds })).toThrow('got 1001');
    expect(() => binanceInput.limit({ value: 2.5, ...bounds })).toThrow('whole number');
    expect(() => binanceInput.limit({ value: '1e3', ...bounds })).toThrow('whole number');
    expect(() => binanceInput.limit({ value: 'ten', ...bounds, fieldName: 'Depth' })).toThrow('Depth must be a whole number');
  });
});

describe('window size', () => {
  it.each([
    ['1m', '1m'],
    ['59m', '59m'],
    ['01h', '1h'],
    ['23h', '23h'],
    [' 7d ', '7d'],
  ])('%j -> %s', (input, expected) => {
    expect(binanceInput.windowSize({ value: input, defaultValue: '1h' })).toBe(expected);
  });
  it('defaults when empty', () => {
    expect(binanceInput.windowSize({ value: undefined, defaultValue: '1h' })).toBe('1h');
  });
  it.each(['0m', '60m', '24h', '8d', '9d', '1D', '1w', '1d2h', 'abc', '100m'])('rejects %j', (input) => {
    expect(() => binanceInput.windowSize({ value: input, defaultValue: '1h' })).toThrow('is not valid');
  });
});

describe('time zone', () => {
  it.each(['0', '8', '+3', '-5', '05:45', '+05:45', '-03:30', '-12:00', '14:00', '+14'])('accepts %j', (input) => {
    expect(binanceInput.timeZone({ value: input })).toBe(input);
  });
  it('accepts a number and returns undefined when empty', () => {
    expect(binanceInput.timeZone({ value: 8 })).toBe('8');
    expect(binanceInput.timeZone({ value: '' })).toBeUndefined();
  });
  it.each(['14:30', '-12:30', '15', '5:7', '05:60', 'UTC', '+'])('rejects %j', (input) => {
    expect(() => binanceInput.timeZone({ value: input })).toThrow('is not valid');
  });
});

describe('epoch milliseconds', () => {
  it('parses ISO dates, digit strings and numbers', () => {
    expect(binanceInput.epochMs({ value: '2026-09-20T00:00:00.000Z', fieldName: 'Start Time' })).toBe(Date.UTC(2026, 8, 20));
    expect(binanceInput.epochMs({ value: '1789862400000', fieldName: 'Start Time' })).toBe(1789862400000);
    expect(binanceInput.epochMs({ value: 1789862400000, fieldName: 'Start Time' })).toBe(1789862400000);
    expect(binanceInput.epochMs({ value: undefined, fieldName: 'Start Time' })).toBeUndefined();
  });
  it('rejects unparsable values', () => {
    expect(() => binanceInput.epochMs({ value: 'next tuesday', fieldName: 'Start Time' })).toThrow('Start Time must be a date');
    expect(() => binanceInput.epochMs({ value: 1.5, fieldName: 'End Time' })).toThrow('End Time must be a date');
  });
  it('rejects dates before 2001, such as epoch seconds read as milliseconds', () => {
    expect(() => binanceInput.epochMs({ value: 1789862400, fieldName: 'Start Time' })).toThrow('Start Time resolves to 1970-01-21T');
    expect(() => binanceInput.epochMs({ value: '1796-02-24T00:00:00.000Z', fieldName: 'Start Time' })).toThrow('Start Time resolves to 1796-02-24T00:00:00.000Z, which is before 2001');
    expect(() => binanceInput.epochMs({ value: -1, fieldName: 'End Time' })).toThrow('which is before 2001');
  });
});

describe('kline interval', () => {
  it('accepts all 16 documented intervals, case-sensitive', () => {
    for (const interval of binanceInput.KLINE_INTERVALS) {
      expect(binanceInput.klineInterval({ value: interval })).toBe(interval);
    }
    expect(binanceInput.KLINE_INTERVALS).toHaveLength(16);
  });
  it.each(['1H', '2m', '1y', '', undefined])('rejects %j', (input) => {
    expect(() => binanceInput.klineInterval({ value: input })).toThrow('is not valid');
  });
});
