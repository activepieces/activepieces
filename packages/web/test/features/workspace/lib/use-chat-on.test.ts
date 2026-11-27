// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatOn } from '@/features/workspace/lib/use-chat-on';

const state = vi.hoisted(() => ({
  embedded: false,
  chatEnabled: true,
  handle: { shell: 'project', chat: undefined as 'full' | undefined },
}));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { isEmbedded: state.embedded } }),
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: { plan: { chatEnabled: state.chatEnabled } },
    }),
  },
}));

vi.mock('@/lib/shell-handle', () => ({
  CHAT_ALLOWED: { project: true, builder: true, platform: false },
  useShellHandle: () => state.handle,
}));

beforeEach(() => {
  state.embedded = false;
  state.chatEnabled = true;
  state.handle = { shell: 'project', chat: undefined };
});

describe('useChatOn', () => {
  it('keeps the full-page chat when embedded', () => {
    state.embedded = true;
    state.handle = { shell: 'project', chat: 'full' };

    expect(renderHook(() => useChatOn()).result.current).toBe(true);
  });

  it('hides the docked chat when embedded', () => {
    state.embedded = true;

    expect(renderHook(() => useChatOn()).result.current).toBe(false);
  });

  it('hides the chat when the plan has no chat', () => {
    state.chatEnabled = false;
    state.handle = { shell: 'project', chat: 'full' };

    expect(renderHook(() => useChatOn()).result.current).toBe(false);
  });
});
