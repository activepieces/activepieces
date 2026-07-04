import { describe, it, expect } from 'vitest';

import {
  formatCurrency,
  isSafeEmail,
  isSafeUrl,
  toBoolean,
} from '@/components/custom/smart-output-viewer/format-value';
import { pathUtils } from '@/lib/path-utils';

const { parsePath, getValueByDotPath } = pathUtils;

describe('parsePath', () => {
  it('parses simple dot notation', () => {
    expect(parsePath('a.b.c')).toEqual(['a', 'b', 'c']);
  });

  it('parses bracket numeric indices', () => {
    expect(parsePath('items[0]')).toEqual(['items', 0]);
  });

  it('parses bracket string keys with double quotes', () => {
    expect(parsePath('data["foo bar"]')).toEqual(['data', 'foo bar']);
  });

  it('parses bracket string keys with single quotes', () => {
    expect(parsePath("data['foo bar']")).toEqual(['data', 'foo bar']);
  });

  it('parses escaped quotes inside bracket keys', () => {
    expect(parsePath('data["he said \\"hi\\""]')).toEqual([
      'data',
      'he said "hi"',
    ]);
  });

  it('parses mixed dot and bracket notation', () => {
    expect(parsePath('user.addresses[0].city')).toEqual([
      'user',
      'addresses',
      0,
      'city',
    ]);
  });

  it('returns an empty array for an empty string', () => {
    expect(parsePath('')).toEqual([]);
  });

  it('treats non-numeric bracket content as a string segment', () => {
    expect(parsePath('items[abc]')).toEqual(['items', 'abc']);
  });
});

describe('getValueByDotPath', () => {
  const sample = {
    user: {
      name: 'Ada',
      addresses: [{ city: 'London' }, { city: 'Paris' }],
    },
    data: {
      nested: { value: 42 },
    },
  };

  it('reads top-level keys', () => {
    expect(getValueByDotPath(sample, 'user.name')).toBe('Ada');
  });

  it('reads array indices', () => {
    expect(getValueByDotPath(sample, 'user.addresses[0].city')).toBe('London');
  });

  it('returns undefined for missing paths', () => {
    expect(getValueByDotPath(sample, 'user.age')).toBeUndefined();
  });

  it('returns the input itself for an empty path', () => {
    expect(getValueByDotPath(sample, '')).toBe(sample);
  });

  it('returns undefined for primitive inputs', () => {
    expect(getValueByDotPath('hello', 'a')).toBeUndefined();
    expect(getValueByDotPath(null, 'a')).toBeUndefined();
  });

  it('falls back through common wrapper keys when direct lookup misses', () => {
    const wrapped = { data: { user: { id: 'u-1' } } };
    expect(getValueByDotPath(wrapped, 'user.id')).toBe('u-1');
  });

  it('does not loop the wrapper fallback when the direct lookup already starts with the wrapper', () => {
    const obj = { data: { name: 'x' } };
    expect(getValueByDotPath(obj, 'data.name')).toBe('x');
  });
});

describe('isSafeUrl', () => {
  it('accepts http and https', () => {
    expect(isSafeUrl('https://example.com')).toBe(true);
    expect(isSafeUrl('http://example.com/path?q=1')).toBe(true);
  });

  it('rejects javascript: scheme', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects data: scheme', () => {
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects vbscript: and file: schemes', () => {
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(isSafeUrl('not a url')).toBe(false);
    expect(isSafeUrl('')).toBe(false);
  });

  it('is case-insensitive on the scheme', () => {
    expect(isSafeUrl('HTTPS://example.com')).toBe(true);
    expect(isSafeUrl('JaVaScRiPt:alert(1)')).toBe(false);
  });
});

describe('isSafeEmail', () => {
  it('accepts ordinary email addresses', () => {
    expect(isSafeEmail('user@example.com')).toBe(true);
  });

  it('rejects values containing newline header injection', () => {
    expect(isSafeEmail('user@example.com\r\nBcc: attacker@evil.com')).toBe(
      false,
    );
    expect(isSafeEmail('user@example.com\nBcc: attacker@evil.com')).toBe(false);
  });
});

describe('toBoolean', () => {
  it('returns the native boolean unchanged', () => {
    expect(toBoolean(true)).toBe(true);
    expect(toBoolean(false)).toBe(false);
  });

  it('treats common false-y strings as false', () => {
    expect(toBoolean('false')).toBe(false);
    expect(toBoolean('FALSE')).toBe(false);
    expect(toBoolean('  False  ')).toBe(false);
    expect(toBoolean('0')).toBe(false);
    expect(toBoolean('no')).toBe(false);
    expect(toBoolean('off')).toBe(false);
  });

  it('treats other non-empty strings as true', () => {
    expect(toBoolean('true')).toBe(true);
    expect(toBoolean('TRUE')).toBe(true);
    expect(toBoolean('yes')).toBe(true);
    expect(toBoolean('1')).toBe(true);
  });

  it('coerces numbers like JS truthiness without surprises', () => {
    expect(toBoolean(0)).toBe(false);
    expect(toBoolean(1)).toBe(true);
    expect(toBoolean(-1)).toBe(true);
  });
});

describe('formatCurrency', () => {
  it('formats a finite number with a valid ISO currency code', () => {
    expect(formatCurrency(19.99, 'USD')).toMatch(/19\.99/);
  });

  it('falls back to plain number formatting when no currency is supplied', () => {
    expect(formatCurrency(1000, undefined)).not.toMatch(/[A-Z]{3}|\$|€|¥/);
  });

  it('falls back to plain number formatting on invalid currency codes (no crash)', () => {
    expect(() => formatCurrency(19.99, 'US')).not.toThrow();
    expect(() => formatCurrency(19.99, 'NOT-A-CODE')).not.toThrow();
    expect(formatCurrency(19.99, 'US')).toMatch(/19\.99/);
  });
});
