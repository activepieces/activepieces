import { describe, expect, it } from 'vitest';
import { fullPageSize } from './list-images';

describe('fullPageSize', () => {
  it('uses the requested limit for v2 keys', () => {
    expect(fullPageSize({ apiKey: 'abc', limit: 100 })).toBe(100);
    expect(fullPageSize({ apiKey: 'abc', limit: 10 })).toBe(10);
  });

  it('caps at 25 for v5 keys but keeps smaller limits', () => {
    expect(fullPageSize({ apiKey: 'bb_ak_v5_x', limit: 100 })).toBe(25);
    expect(fullPageSize({ apiKey: 'bb_ak_v5_x', limit: 10 })).toBe(10);
  });
});
