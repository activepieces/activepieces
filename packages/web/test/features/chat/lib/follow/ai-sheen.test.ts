import { describe, expect, it } from 'vitest';

import { aiSheen } from '@/features/chat/lib/follow/ai-sheen';

describe('aiSheen.durationFor', () => {
  it('moves the band at 1000 px per second', () => {
    expect(aiSheen.durationFor(560)).toBe(700);
  });

  it('never runs shorter than 420 ms', () => {
    expect(aiSheen.durationFor(120)).toBe(420);
  });

  it('never runs longer than 900 ms', () => {
    expect(aiSheen.durationFor(2400)).toBe(900);
  });
});

describe('aiSheen.delaysByTop', () => {
  it('staggers items by 40 ms from top to bottom', () => {
    expect(aiSheen.delaysByTop([120, 40, 80])).toEqual([80, 0, 40]);
  });

  it('starts items on the same line together', () => {
    expect(aiSheen.delaysByTop([40, 40.3, 80])).toEqual([0, 0, 40]);
  });
});
