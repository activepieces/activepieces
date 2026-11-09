import { tryCatch } from '@activepieces/core-utils';
import { AgentConversation, SeekPage } from '@activepieces/shared';
import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { chatApi } from './chat-api';
import { usePendingDeletes } from './chat-pending-deletes';
import { chatQueryKeys } from './chat-query-keys';

export function useChatConversations() {
  const query = useInfiniteQuery<
    SeekPage<AgentConversation>,
    Error,
    InfiniteData<SeekPage<AgentConversation>>,
    QueryKey,
    string | undefined
  >({
    queryKey: chatQueryKeys.conversationList(),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    queryFn: ({ pageParam }) =>
      chatApi.listConversations({ limit: PAGE_SIZE, cursor: pageParam }),
  });
  const pendingDeletes = usePendingDeletes((state) => state.ids);
  const conversations = useMemo(
    () =>
      (query.data?.pages.flatMap((page) => page.data) ?? []).filter(
        (conversation) => !pendingDeletes.has(conversation.id),
      ),
    [query.data, pendingDeletes],
  );
  return { ...query, conversations };
}

async function rename({
  queryClient,
  id,
  title,
  previousTitle,
}: {
  queryClient: QueryClient;
  id: string;
  title: string;
  previousTitle: string | null;
}): Promise<void> {
  setTitle({ queryClient, id, title });
  const { error } = await tryCatch(() =>
    chatApi.updateConversation(id, { title }),
  );
  if (error) {
    if (previousTitle !== null) {
      setTitle({ queryClient, id, title: previousTitle });
    }
    toast.error(t('Failed to rename conversation'));
  }
  queryClient
    .invalidateQueries({ queryKey: chatQueryKeys.allConversationLists() })
    .catch(() => undefined);
}

function setTitle({
  queryClient,
  id,
  title,
}: {
  queryClient: QueryClient;
  id: string;
  title: string;
}): void {
  queryClient.setQueriesData<InfiniteData<SeekPage<AgentConversation>>>(
    { queryKey: chatQueryKeys.allConversationLists() },
    (lists) =>
      lists && {
        ...lists,
        pages: lists.pages.map((page) => ({
          ...page,
          data: page.data.map((conversation) =>
            conversation.id === id ? { ...conversation, title } : conversation,
          ),
        })),
      },
  );
  const key = chatQueryKeys.conversation(id);
  if (!queryClient.getQueryData<AgentConversation | null>(key)) {
    queryClient.invalidateQueries({ queryKey: key }).catch(() => undefined);
    return;
  }
  queryClient.setQueryData<AgentConversation | null>(key, (cached) =>
    cached ? { ...cached, title } : cached,
  );
}

const PAGE_SIZE = 100;

export const chatConversations = {
  rename,
  setTitle,
};
