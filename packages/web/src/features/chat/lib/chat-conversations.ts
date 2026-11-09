import { tryCatch } from '@activepieces/core-utils';
import { AgentConversation, SeekPage } from '@activepieces/shared';
import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { toast } from 'sonner';

import { chatApi } from './chat-api';
import { chatHistoryUtils } from './chat-history-utils';
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
      chatHistoryUtils.byLastActivity(
        (query.data?.pages.flatMap((page) => page.data) ?? []).filter(
          (conversation) => !pendingDeletes.has(conversation.id),
        ),
      ),
    [query.data, pendingDeletes],
  );
  return { ...query, conversations };
}

export function useHasConversations(): boolean {
  const queryClient = useQueryClient();
  const subscribe = useCallback(
    (onChange: () => void) => queryClient.getQueryCache().subscribe(onChange),
    [queryClient],
  );
  const read = useCallback(
    () =>
      queryClient
        .getQueriesData<InfiniteData<SeekPage<AgentConversation>>>({
          queryKey: chatQueryKeys.conversationList(),
        })
        .some(([, data]) =>
          (data?.pages ?? []).some((page) => page.data.length > 0),
        ),
    [queryClient],
  );
  return useSyncExternalStore(subscribe, read);
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
    const newerRename = cachedTitle({ queryClient, id }) !== title;
    if (previousTitle !== null && !newerRename) {
      setTitle({ queryClient, id, title: previousTitle });
    }
    toast.error(t('Failed to rename conversation'));
  }
  queryClient
    .invalidateQueries({ queryKey: chatQueryKeys.allConversationLists() })
    .catch(() => undefined);
  queryClient
    .invalidateQueries({ queryKey: chatQueryKeys.conversation(id) })
    .catch(() => undefined);
}

function cachedTitle({
  queryClient,
  id,
}: {
  queryClient: QueryClient;
  id: string;
}): string | null | undefined {
  const cached = queryClient.getQueryData<AgentConversation | null>(
    chatQueryKeys.conversation(id),
  );
  if (cached) return cached.title;
  const lists = queryClient.getQueriesData<
    InfiniteData<SeekPage<AgentConversation>>
  >({ queryKey: chatQueryKeys.allConversationLists() });
  for (const [, list] of lists) {
    const found = list?.pages
      .flatMap((page) => page.data)
      .find((conversation) => conversation.id === id);
    if (found) return found.title;
  }
  return undefined;
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
