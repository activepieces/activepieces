import { describe, expect, it } from 'vitest';

import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';

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
