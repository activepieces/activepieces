/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { aiSheen } from '@/features/chat/lib/follow/ai-sheen';
import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { useAiFieldHighlights } from '@/features/chat/lib/follow/use-ai-highlight';

vi.mock('@/features/chat/lib/follow/ai-sheen', () => ({
  aiSheen: { play: vi.fn(() => false) },
}));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'p1' },
}));
vi.mock('@/features/workspace/lib/chat-panel-open', () => ({
  useChatPanel: { getState: () => ({ conversationId: 'c1' }) },
}));

const INITIAL = useFollowAlong.getState();

describe('useAiFieldHighlights', () => {
  beforeEach(() => {
    vi.stubGlobal('CSS', { escape: (value: string) => value });
    useFollowAlong.setState(INITIAL, true);
    document.body.innerHTML =
      '<div data-ai-field="flow-step:a"></div><div data-ai-field="flow-step:b"></div>';
  });

  afterEach(() => {
    vi.mocked(aiSheen.play).mockClear();
  });

  it('plays each flash once, even when later flashes arrive', () => {
    renderHook(() => useAiFieldHighlights());
    act(() => followAlong.flash(['flow-step:a']));
    act(() => followAlong.flash(['flow-step:b']));
    act(() => followAlong.flash(['flow-step:a']));

    const played = vi
      .mocked(aiSheen.play)
      .mock.calls.map(([{ elements }]) =>
        elements[0].getAttribute('data-ai-field'),
      );
    expect(played).toEqual(['flow-step:a', 'flow-step:b', 'flow-step:a']);
  });
});
