// @vitest-environment jsdom
import { AgentConversation, AgentRunSource } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { createElement, ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  conversationIndicatorUtils,
  useConversationIndicators,
} from '@/features/chat/lib/use-conversation-indicators';

describe('seeding when each conversation was last seen', () => {
  it('treats conversations already there on the first load as seen', () => {
    const seeded = conversationIndicatorUtils.seedLastSeen({
      prev: {},
      conversations: [{ id: 'a', updated: T1 }],
      initialLoad: true,
    });
    expect(T1 > seeded.a).toBe(false);
  });

  it('shows a conversation that appears later, already finished, as unread', () => {
    const seeded = conversationIndicatorUtils.seedLastSeen({
      prev: { a: T1 },
      conversations: [
        { id: 'a', updated: T1 },
        { id: 'b', updated: T1 },
      ],
      initialLoad: false,
    });
    expect(T1 > seeded.b).toBe(true);
    expect(seeded.a).toBe(T1);
  });
});

describe('unread dots across loads', () => {
  afterEach(() => localStorage.clear());

  it('shows a finished chat as unread when it arrives after an empty first load', () => {
    const { result, rerender } = renderIndicators({
      conversations: [],
      scope: 'chat',
    });
    const arrived = conversation({ id: 'b' });
    rerender({ conversations: [arrived], scope: 'chat' });

    expect(result.current.getIndicator(arrived)).toBe('unread');
  });

  it('does not mark existing chats unread when switching to another agent', () => {
    const { result, rerender } = renderIndicators({
      conversations: [conversation({ id: 'a' })],
      scope: 'agent-1',
    });
    const otherAgentChat = conversation({ id: 'b' });
    rerender({ conversations: [otherAgentChat], scope: 'agent-2' });

    expect(result.current.getIndicator(otherAgentChat)).toBeNull();
  });
});

function renderIndicators(initialProps: {
  conversations: AgentConversation[];
  scope: string;
}) {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return renderHook(
    ({ conversations, scope }) =>
      useConversationIndicators({
        conversations,
        activeId: null,
        scope,
        loaded: true,
      }),
    { initialProps, wrapper },
  );
}

function conversation({ id }: { id: string }): AgentConversation {
  return AgentConversation.parse({
    id,
    created: T1,
    updated: T1,
    platformId: 'platform-1',
    userId: 'user-1',
    source: AgentRunSource.CHAT,
  });
}

const T1 = '2026-11-03T10:00:00.000Z';
