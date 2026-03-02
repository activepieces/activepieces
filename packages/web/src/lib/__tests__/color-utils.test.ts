import { describe, it, expect } from 'vitest';

import { colorsUtils } from '../color-utils';

describe('colorsUtils.parseToHsl', () => {
  it('parses pure red', () => {
    const result = colorsUtils.parseToHsl('#FF0000');
    expect(result.hue).toBeCloseTo(0);
    expect(result.saturation).toBeCloseTo(1);
    expect(result.lightness).toBeCloseTo(0.5);
  });

  it('parses pure green', () => {
    const result = colorsUtils.parseToHsl('#00FF00');
    expect(result.hue).toBeCloseTo(120);
    expect(result.saturation).toBeCloseTo(1);
    expect(result.lightness).toBeCloseTo(0.5);
  });

  it('parses pure blue', () => {
    const result = colorsUtils.parseToHsl('#0000FF');
    expect(result.hue).toBeCloseTo(240);
    expect(result.saturation).toBeCloseTo(1);
    expect(result.lightness).toBeCloseTo(0.5);
  });

  it('parses white', () => {
    const result = colorsUtils.parseToHsl('#FFFFFF');
    expect(result.saturation).toBeCloseTo(0);
    expect(result.lightness).toBeCloseTo(1);
  });

  it('parses black', () => {
    const result = colorsUtils.parseToHsl('#000000');
    expect(result.saturation).toBeCloseTo(0);
    expect(result.lightness).toBeCloseTo(0);
  });

  it('parses 3-digit hex', () => {
    const result = colorsUtils.parseToHsl('#F00');
    expect(result.hue).toBeCloseTo(0);
    expect(result.saturation).toBeCloseTo(1);
    expect(result.lightness).toBeCloseTo(0.5);
  });
});

describe('colorsUtils.hexToHslString', () => {
  it('returns formatted HSL string', () => {
    const result = colorsUtils.hexToHslString('#FF0000');
    expect(result).toMatch(/^\d+\.\d+\s\d+\.\d+%\s\d+\.\d+%$/);
  });

  it('formats pure red correctly', () => {
    const result = colorsUtils.hexToHslString('#FF0000');
    expect(result).toBe('0.0 100.0% 50.0%');
  });
});

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
