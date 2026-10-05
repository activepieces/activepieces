import { describe, it, expect } from 'vitest';

import { colorsUtils } from '../color-utils';

describe('colorsUtils.isGrayColor', () => {
  it('returns true for gray RGB values', () => {
    expect(colorsUtils.isGrayColor(128, 128, 128)).toBe(true);
  });

  it('returns true for dark RGB values', () => {
    expect(colorsUtils.isGrayColor(50, 50, 50)).toBe(true);
  });

  it('returns true for light RGB values', () => {
    expect(colorsUtils.isGrayColor(230, 230, 230)).toBe(true);
  });

  it('returns false for colorful RGB values', () => {
    expect(colorsUtils.isGrayColor(255, 0, 0)).toBe(false);
  });

  it('returns false for moderately colorful values', () => {
    expect(colorsUtils.isGrayColor(200, 100, 50)).toBe(false);
  });
});
