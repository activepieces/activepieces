import { describe, expect, it } from 'vitest';

import { iterationRailUtils } from '@/app/builder/run-details/iteration-rail-utils';

describe('iterationRailUtils.clampIndex', () => {
  it('converts a 1-based entry to a 0-based index', () => {
    expect(iterationRailUtils.clampIndex({ value: '3', total: 5 })).toBe(2);
  });

  it('clamps below the first item', () => {
    expect(iterationRailUtils.clampIndex({ value: '0', total: 5 })).toBe(0);
    expect(iterationRailUtils.clampIndex({ value: '-4', total: 5 })).toBe(0);
  });

  it('clamps above the last item', () => {
    expect(iterationRailUtils.clampIndex({ value: '9', total: 5 })).toBe(4);
  });

  it('falls back to the first item when the entry is not a number', () => {
    expect(iterationRailUtils.clampIndex({ value: 'e', total: 5 })).toBe(0);
    expect(iterationRailUtils.clampIndex({ value: '', total: 5 })).toBe(0);
  });

  it('keeps the first item selected when there is nothing to render', () => {
    expect(iterationRailUtils.clampIndex({ value: '1', total: 0 })).toBe(0);
  });
});
