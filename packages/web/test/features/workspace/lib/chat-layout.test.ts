import { describe, expect, it } from 'vitest';

import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';

const base = {
  fullPage: false,
  open: true,
  mode: 'right' as const,
  viewportWidth: 1440,
};

describe('chatLayoutUtils.widthFor', () => {
  it('is full on the chat page even when the dock is closed', () => {
    expect(
      chatLayoutUtils.widthFor({ ...base, fullPage: true, open: false }),
    ).toBe('full');
  });

  it('docks on the saved side from 768 px up', () => {
    expect(chatLayoutUtils.widthFor(base)).toBe('right');
    expect(
      chatLayoutUtils.widthFor({ ...base, mode: 'left', viewportWidth: 800 }),
    ).toBe('left');
  });

  it('uses the bottom sheet under 768 px', () => {
    expect(chatLayoutUtils.widthFor({ ...base, viewportWidth: 390 })).toBe(
      'sheet',
    );
    expect(
      chatLayoutUtils.widthFor({ ...base, open: false, viewportWidth: 390 }),
    ).toBe('closed');
  });

  it('is closed when not open', () => {
    expect(chatLayoutUtils.widthFor({ ...base, open: false })).toBe('closed');
  });
});

describe('chatLayoutUtils.dockWidthFor', () => {
  it('keeps a width between 320 and 640', () => {
    expect(chatLayoutUtils.dockWidthFor(400)).toBe(400);
  });

  it('clamps to 320 and 640', () => {
    expect(chatLayoutUtils.dockWidthFor(900)).toBe(640);
    expect(chatLayoutUtils.dockWidthFor(100)).toBe(320);
  });
});
