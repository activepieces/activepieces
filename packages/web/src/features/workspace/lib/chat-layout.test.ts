import { describe, expect, it } from 'vitest';

import { chatWidthFor } from './chat-layout';

const base = {
  fullPage: false,
  open: true,
  mode: 'right' as const,
  split: false,
  viewportWidth: 1440,
};

describe('chatWidthFor', () => {
  it('keeps full width on the chat page even when split', () => {
    expect(chatWidthFor({ ...base, fullPage: true, split: true })).toBe('full');
  });

  it('docks left while split without touching the saved mode', () => {
    expect(chatWidthFor({ ...base, split: true })).toBe('left');
    expect(chatWidthFor({ ...base, split: false })).toBe('right');
  });

  it('floats a split between 768 and 959 px', () => {
    expect(chatWidthFor({ ...base, split: true, viewportWidth: 900 })).toBe(
      'float',
    );
  });

  it('uses the sheet under 768 px', () => {
    expect(chatWidthFor({ ...base, split: true, viewportWidth: 390 })).toBe(
      'sheet',
    );
  });

  it('is closed when not open', () => {
    expect(chatWidthFor({ ...base, open: false, split: true })).toBe('closed');
  });
});
