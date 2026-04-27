import { describe, it, expect } from 'vitest';

import { pathUtils } from '@/lib/path-utils';

describe('pathUtils.parsePath', () => {
  it('parses dot notation', () => {
    expect(pathUtils.parsePath('a.b.c')).toEqual(['a', 'b', 'c']);
  });

  it('parses bracket numeric indices', () => {
    expect(pathUtils.parsePath('items[0]')).toEqual(['items', 0]);
  });

  it('parses quoted bracket keys', () => {
    expect(pathUtils.parsePath('data["foo bar"]')).toEqual(['data', 'foo bar']);
  });
});

describe('pathUtils.resolvePathWithWrapperFallback', () => {
  it('returns the value with the original path when direct hit', () => {
    const obj = { a: { b: 1 } };
    expect(pathUtils.resolvePathWithWrapperFallback(obj, 'a.b')).toEqual({
      value: 1,
      resolvedPath: 'a.b',
    });
  });

  it('falls back through common wrappers and reports the resolved path', () => {
    const obj = { data: { a: { b: 'x' } } };
    expect(pathUtils.resolvePathWithWrapperFallback(obj, 'a.b')).toEqual({
      value: 'x',
      resolvedPath: 'data.a.b',
    });
  });

  it('returns undefined for primitive obj', () => {
    expect(
      pathUtils.resolvePathWithWrapperFallback('hello', 'a').value,
    ).toBeUndefined();
  });

  it('returns the obj itself for empty path', () => {
    const obj = { a: 1 };
    expect(pathUtils.resolvePathWithWrapperFallback(obj, '').value).toBe(obj);
  });
});

describe('pathUtils.getValueByDotPath', () => {
  it('extracts value at the path', () => {
    const obj = { user: { addresses: [{ city: 'London' }] } };
    expect(pathUtils.getValueByDotPath(obj, 'user.addresses[0].city')).toBe(
      'London',
    );
  });
});
