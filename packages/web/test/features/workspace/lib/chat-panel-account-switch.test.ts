// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';
import { authenticationSession } from '@/lib/authentication-session';

describe('chat panel when the account changes in another tab', () => {
  it('starts a fresh chat and drops the old account prompt', () => {
    vi.spyOn(authenticationSession, 'getToken').mockReturnValue('token');
    vi.spyOn(authenticationSession, 'getPlatformId').mockReturnValue('p1');
    const user = vi
      .spyOn(authenticationSession, 'getCurrentUserId')
      .mockReturnValue('alice');
    window.dispatchEvent(new Event('storage'));
    useChatPanel.setState({
      conversationId: 'alice-chat',
      pendingPrompt: 'hi',
    });
    const tokenBefore = useChatPanel.getState().newChatToken;

    user.mockReturnValue('bob');
    window.dispatchEvent(new Event('storage'));

    const state = useChatPanel.getState();
    expect(state.owner).toBe('p1:bob');
    expect(state.conversationId).toBeNull();
    expect(state.pendingPrompt).toBeUndefined();
    expect(state.newChatToken).toBe(tokenBefore + 1);
  });
});
