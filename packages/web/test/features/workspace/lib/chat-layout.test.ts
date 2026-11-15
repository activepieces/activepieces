import { describe, expect, it } from 'vitest';

import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';

const base: Parameters<typeof chatLayoutUtils.widthFor>[0] = {
  fullPage: false,
  open: true,
  mode: 'right',
  phone: false,
};

describe('chatLayoutUtils.widthFor', () => {
  it('is full on the chat page even when the dock is closed', () => {
    expect(
      chatLayoutUtils.widthFor({ ...base, fullPage: true, open: false }),
    ).toBe('full');
  });

  it('docks on the saved side off phones', () => {
    expect(chatLayoutUtils.widthFor(base)).toBe('right');
    expect(
      chatLayoutUtils.widthFor({ ...base, mode: 'left' }),
    ).toBe('left');
  });

  it('uses the bottom sheet on phones', () => {
    expect(chatLayoutUtils.widthFor({ ...base, phone: true })).toBe('sheet');
    expect(
      chatLayoutUtils.widthFor({ ...base, open: false, phone: true }),
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

describe('chatLayoutUtils.toastPlacementFor', () => {
  it('keeps toasts in the default corner without a chat panel', () => {
    expect(chatLayoutUtils.toastPlacementFor(null)).toEqual({
      position: 'bottom-right',
      offset: undefined,
    });
  });

  it('moves toasts away from a chat docked on the right', () => {
    expect(chatLayoutUtils.toastPlacementFor('right').position).toBe(
      'bottom-left',
    );
  });

  it('keeps toasts off the composer of a full-page chat', () => {
    expect(chatLayoutUtils.toastPlacementFor('full')).toEqual({
      position: 'top-center',
      offset: { top: 80 },
    });
  });
});
