import { afterEach, describe, expect, it, vi } from 'vitest';

const chat = vi.hoisted(() => ({ gateOpen: false }));

vi.mock('@/features/workspace/lib/chat-panel-open', () => ({
  useChatPanel: { getState: () => chat },
}));

import {
  followHold,
  useFollowHold,
} from '@/features/chat/lib/follow/follow-hold';

describe('followHold', () => {
  afterEach(() => {
    followHold.report({ pressing: false, drafting: false, scrolledUp: false });
  });

  it('tracks a pointer pressed on the page apart from the holds that show the offer', () => {
    followHold.report({ pressing: true });

    expect(followHold.holds({ fullPage: false })).toBe(false);
    expect(followHold.pagePressed()).toBe(true);
  });

  it('lets go once the pointer is released', () => {
    followHold.report({ pressing: true });
    followHold.report({ pressing: false });

    expect(followHold.holds({ fullPage: false })).toBe(false);
    expect(useFollowHold.getState().pressing).toBe(false);
  });
});

describe('followHold.report', () => {
  it('leaves the store alone when nothing changed', () => {
    const listener = vi.fn();
    const unsubscribe = useFollowHold.subscribe(listener);

    followHold.report({ drafting: false, scrolledUp: false });
    unsubscribe();

    expect(listener).not.toHaveBeenCalled();
  });
});
