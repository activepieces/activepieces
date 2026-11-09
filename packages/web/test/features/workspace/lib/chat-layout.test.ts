import { describe, expect, it } from 'vitest';

import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';

const base: Parameters<typeof chatLayoutUtils.widthFor>[0] = {
  fullPage: false,
  open: true,
  mode: 'right',
};

describe('chatLayoutUtils.widthFor', () => {
  it('is full on the chat page even when the dock is closed', () => {
    expect(
      chatLayoutUtils.widthFor({ ...base, fullPage: true, open: false }),
    ).toBe('full');
  });

  it('docks on the saved side', () => {
    expect(chatLayoutUtils.widthFor(base)).toBe('right');
    expect(
      chatLayoutUtils.widthFor({ ...base, mode: 'left' }),
    ).toBe('left');
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
