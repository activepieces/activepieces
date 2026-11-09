// @vitest-environment jsdom
import {
  AgentConversation,
  AgentRunSource,
  SeekPage,
} from '@activepieces/shared';
import { InfiniteData, QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { chatConversations } from '@/features/chat/lib/chat-conversations';
import { chatQueryKeys } from '@/features/chat/lib/chat-query-keys';

const mocks = vi.hoisted(() => ({
  updateConversation: vi.fn(),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
vi.mock('@/features/chat/lib/chat-api', () => ({
  chatApi: { updateConversation: mocks.updateConversation },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('chatConversations.rename', () => {
  it('rolls back a failed rename', async () => {
    const queryClient = seeded({ title: 'First' });
    mocks.updateConversation.mockRejectedValue(new Error('down'));

    await chatConversations.rename({
      queryClient,
      id: 'a',
      title: 'Second',
      previousTitle: 'First',
    });

    expect(conversationTitle(queryClient)).toBe('First');
    expect(listTitle(queryClient)).toBe('First');
  });

  it('keeps a newer rename when an older one fails', async () => {
    const queryClient = seeded({ title: 'First' });
    let failOlder: (reason: Error) => void = () => undefined;
    mocks.updateConversation
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            failOlder = reject;
          }),
      )
      .mockResolvedValueOnce(undefined);

    const older = chatConversations.rename({
      queryClient,
      id: 'a',
      title: 'Second',
      previousTitle: 'First',
    });
    await chatConversations.rename({
      queryClient,
      id: 'a',
      title: 'Third',
      previousTitle: 'Second',
    });
    failOlder(new Error('down'));
    await older;

    expect(conversationTitle(queryClient)).toBe('Third');
    expect(listTitle(queryClient)).toBe('Third');
  });

  it('refreshes the conversation itself after a rename', async () => {
    const queryClient = seeded({ title: 'First' });
    mocks.updateConversation.mockResolvedValue(undefined);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await chatConversations.rename({
      queryClient,
      id: 'a',
      title: 'Second',
      previousTitle: 'First',
    });

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: chatQueryKeys.conversation('a'),
    });
  });
});

function seeded({ title }: { title: string }): QueryClient {
  const queryClient = new QueryClient();
  const item = conversation({ title });
  queryClient.setQueryData(chatQueryKeys.conversation('a'), item);
  queryClient.setQueryData<InfiniteData<SeekPage<AgentConversation>>>(
    chatQueryKeys.conversationList(),
    {
      pages: [{ data: [item], next: null, previous: null }],
      pageParams: [undefined],
    },
  );
  return queryClient;
}

function conversationTitle(
  queryClient: QueryClient,
): string | null | undefined {
  return queryClient.getQueryData<AgentConversation>(
    chatQueryKeys.conversation('a'),
  )?.title;
}

function listTitle(queryClient: QueryClient): string | null | undefined {
  return queryClient.getQueryData<InfiniteData<SeekPage<AgentConversation>>>(
    chatQueryKeys.conversationList(),
  )?.pages[0].data[0].title;
}

function conversation({ title }: { title: string }): AgentConversation {
  const now = new Date().toISOString();
  return AgentConversation.parse({
    id: 'a',
    created: now,
    updated: now,
    platformId: 'platform-1',
    userId: 'user-1',
    source: AgentRunSource.CHAT,
    title,
  });
}
