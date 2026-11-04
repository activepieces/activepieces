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
  it('treats conversations up to the first load as seen', () => {
    const seeded = conversationIndicatorUtils.seedLastSeen({
      prev: {},
      conversations: [{ id: 'a', updated: T1 }],
      baseline: T1,
    });
    expect(T1 > seeded.a).toBe(false);
  });

  it('shows a conversation updated after the first load as unread', () => {
    const seeded = conversationIndicatorUtils.seedLastSeen({
      prev: { a: T1 },
      conversations: [
        { id: 'a', updated: T1 },
        { id: 'b', updated: T2 },
      ],
      baseline: T1,
    });
    expect(T2 > seeded.b).toBe(true);
    expect(seeded.a).toBe(T1);
  });

  it('treats an older page loaded later as already seen', () => {
    const seeded = conversationIndicatorUtils.seedLastSeen({
      prev: { b: T2 },
      conversations: [
        { id: 'b', updated: T2 },
        { id: 'a', updated: T1 },
      ],
      baseline: T2,
    });
    expect(T1 > seeded.a).toBe(false);
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

  it('treats chats from the first successful load as seen after a failed load', () => {
    const { result, rerender } = renderIndicators({
      conversations: [],
      scope: 'chat',
      loaded: false,
    });
    const existing = conversation({ id: 'a' });
    rerender({ conversations: [existing], scope: 'chat', loaded: true });

    expect(result.current.getIndicator(existing)).toBeNull();
  });

  it('keeps chats from an older page read when it is appended', () => {
    const { result, rerender } = renderIndicators({
      conversations: [conversation({ id: 'b', updated: T2 })],
      scope: 'chat',
    });
    const olderChat = conversation({ id: 'a', updated: T1 });
    rerender({
      conversations: [conversation({ id: 'b', updated: T2 }), olderChat],
      scope: 'chat',
    });

    expect(result.current.getIndicator(olderChat)).toBeNull();
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
  loaded?: boolean;
}) {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return renderHook(
    ({ conversations, scope, loaded = true }) =>
      useConversationIndicators({
        conversations,
        activeId: null,
        scope,
        loaded,
      }),
    { initialProps, wrapper },
  );
}

function conversation({
  id,
  updated = T1,
}: {
  id: string;
  updated?: string;
}): AgentConversation {
  return AgentConversation.parse({
    id,
    created: T1,
    updated,
    platformId: 'platform-1',
    userId: 'user-1',
    source: AgentRunSource.CHAT,
  });
}

const T1 = '2026-11-03T10:00:00.000Z';
const T2 = '2026-11-03T11:00:00.000Z';
