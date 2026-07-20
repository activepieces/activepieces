import { SeekPage } from '@activepieces/core-utils';
import { ChatConversation } from '@activepieces/shared';
import { QueryClient, useQuery } from '@tanstack/react-query';

import { platformHooks } from '@/hooks/platform-hooks';

import { chatApi } from './chat-api';

export function useChatConversations() {
  const { platform } = platformHooks.useCurrentPlatform();
  return useQuery({
    queryKey: CHAT_CONVERSATIONS_QUERY_KEY,
    queryFn: () => chatApi.listConversations({ limit: 100 }),
    enabled: platform.plan.chatEnabled,
  });
}

function patchTitle({
  queryClient,
  conversationId,
  title,
}: {
  queryClient: QueryClient;
  conversationId: string;
  title: string;
}): void {
  queryClient.setQueryData<SeekPage<ChatConversation>>(
    CHAT_CONVERSATIONS_QUERY_KEY,
    (page) =>
      page
        ? {
            ...page,
            data: page.data.map((conversation) =>
              conversation.id === conversationId
                ? { ...conversation, title }
                : conversation,
            ),
          }
        : page,
  );
}

function invalidate({ queryClient }: { queryClient: QueryClient }): void {
  void queryClient.invalidateQueries({
    queryKey: CHAT_CONVERSATIONS_QUERY_KEY,
  });
}

export const chatConversationsCache = { patchTitle, invalidate };

export const CHAT_CONVERSATIONS_QUERY_KEY = ['chat-conversations'];
