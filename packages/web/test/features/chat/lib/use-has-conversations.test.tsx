/**
 * @vitest-environment jsdom
 */
import {
  AgentConversation,
  AgentRunSource,
  SeekPage,
} from '@activepieces/shared';
import {
  InfiniteData,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useHasConversations } from '@/features/chat/lib/chat-conversations';
import { chatQueryKeys } from '@/features/chat/lib/chat-query-keys';

vi.mock('i18next', () => ({ t: (key: string) => key }));

describe('useHasConversations', () => {
  it('reads the chat list infinite query and follows its updates', () => {
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useHasConversations(), {
      wrapper: ({ children }: React.PropsWithChildren) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });
    expect(result.current).toBe(false);

    act(() => {
      queryClient.setQueryData<InfiniteData<SeekPage<AgentConversation>>>(
        chatQueryKeys.conversationList(),
        { pages: [page({ ids: [] }), page({ ids: ['c1'] })], pageParams: [] },
      );
    });

    expect(result.current).toBe(true);
  });
});

function page({ ids }: { ids: string[] }): SeekPage<AgentConversation> {
  return {
    data: ids.map((id) => conversation({ id })),
    next: null,
    previous: null,
  };
}

function conversation({ id }: { id: string }): AgentConversation {
  return AgentConversation.parse({
    id,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    platformId: 'pl1',
    userId: 'u1',
    source: AgentRunSource.CHAT,
    title: null,
  });
}
