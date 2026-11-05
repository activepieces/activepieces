import { AgentConversation, SeekPage } from '@activepieces/shared';
import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { toast, type ToastT } from 'sonner';

import { chatApi } from '@/features/chat/lib/chat-api';
import { chatUtils } from '@/features/chat/lib/chat-utils';

// The same query the full chat page lists with, so both read one cache: a chat
// started in the panel shows up on /chat, and the other way round.
const LIST_KEY = ['chat-conversations', 'chat'];
const PAGE_SIZE = 100;

export function useChatHistory() {
  const query = useInfiniteQuery<
    SeekPage<AgentConversation>,
    Error,
    InfiniteData<SeekPage<AgentConversation>>,
    QueryKey,
    string | undefined
  >({
    queryKey: LIST_KEY,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    queryFn: ({ pageParam }) =>
      chatApi.listConversations({ limit: PAGE_SIZE, cursor: pageParam }),
  });

  const hidden = useSyncExternalStore(
    pendingDeletes.subscribe,
    pendingDeletes.snapshot,
  );
  const conversations = useMemo(
    () =>
      (query.data?.pages.flatMap((page) => page.data) ?? [])
        .filter((c) => !hidden.has(c.id))
        .sort((a, b) => b.updated.localeCompare(a.updated)),
    [query.data, hidden],
  );

  return { ...query, conversations };
}

// The header's title. A live title from the chat wins, then the list, then a
// direct read for a conversation older than the loaded pages.
export function useConversationTitle({
  conversationId,
  liveTitle,
}: {
  conversationId: string | null;
  liveTitle: string | null;
}): string | null {
  const { conversations, isSuccess } = useChatHistory();
  const listed = conversationId
    ? conversations.find((c) => c.id === conversationId)
    : undefined;
  const { data: fetched } = useQuery({
    queryKey: ['chat-conversation', conversationId],
    queryFn: () => chatApi.getConversation(conversationId!),
    enabled: !!conversationId && isSuccess && !listed && !liveTitle,
    staleTime: Infinity,
  });
  const title = liveTitle ?? listed?.title ?? fetched?.title ?? null;
  return title ? chatUtils.sanitizeTitle(title) : null;
}

export function useChatHistoryActions() {
  const queryClient = useQueryClient();

  const patchList = useCallback(
    (patch: (items: AgentConversation[]) => AgentConversation[]) => {
      queryClient.setQueriesData<InfiniteData<SeekPage<AgentConversation>>>(
        { queryKey: ['chat-conversations'] },
        (data) =>
          data?.pages
            ? {
                ...data,
                pages: data.pages.map((page) => ({
                  ...page,
                  data: patch(page.data),
                })),
              }
            : data,
      );
    },
    [queryClient],
  );

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
  }, [queryClient]);

  const rename = useCallback(
    async (id: string, title: string) => {
      patchList((items) =>
        items.map((c) => (c.id === id ? { ...c, title } : c)),
      );
      try {
        await chatApi.updateConversation(id, { title });
        queryClient.removeQueries({ queryKey: ['chat-conversation', id] });
      } catch {
        toast.error(t('Failed to rename conversation'));
      }
      invalidate();
    },
    [patchList, invalidate, queryClient],
  );

  // The row goes at once; the server delete waits for the undo toast to
  // expire, so Undo only has to show the row again.
  const remove = useCallback(
    (
      id: string,
      {
        onUndo,
        position,
      }: { onUndo?: () => void; position?: ToastT['position'] } = {},
    ) => {
      pendingDeletes.add(id);
      let settled = false;
      const commit = async () => {
        if (settled) return;
        settled = true;
        try {
          await chatApi.deleteConversation(id);
          patchList((items) => items.filter((c) => c.id !== id));
        } catch {
          toast.error(t('Failed to delete conversation'));
        }
        pendingDeletes.remove(id);
        invalidate();
      };
      toast(t('Chat deleted'), {
        duration: UNDO_MS,
        position,
        action: {
          label: t('Undo'),
          onClick: () => {
            if (settled) return;
            settled = true;
            pendingDeletes.remove(id);
            onUndo?.();
          },
        },
        onAutoClose: () => void commit(),
        onDismiss: () => void commit(),
      });
    },
    [patchList, invalidate],
  );

  return { rename, remove, invalidate };
}

const UNDO_MS = 5000;

// Chats deleted from the panel but still inside their undo window. The list
// hides them even if the query refetches meanwhile.
const pendingDeletes = (() => {
  let ids = new Set<string>();
  const listeners = new Set<() => void>();
  const set = (next: Set<string>) => {
    ids = next;
    listeners.forEach((listener) => listener());
  };
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    snapshot: () => ids,
    add: (id: string) => set(new Set(ids).add(id)),
    remove: (id: string) => {
      if (!ids.has(id)) return;
      const next = new Set(ids);
      next.delete(id);
      set(next);
    },
  };
})();

export type HistoryGroup = {
  label: string;
  items: AgentConversation[];
};

export function groupByRecency(
  conversations: AgentConversation[],
  now = new Date(),
): HistoryGroup[] {
  const groups: HistoryGroup[] = [
    { label: t('Today'), items: [] },
    { label: t('Yesterday'), items: [] },
    { label: t('Previous 7 days'), items: [] },
    { label: t('Older'), items: [] },
  ];
  for (const conversation of conversations) {
    const days = daysAgo(new Date(conversation.updated), now);
    const index = days <= 0 ? 0 : days === 1 ? 1 : days <= 7 ? 2 : 3;
    groups[index].items.push(conversation);
  }
  return groups.filter((group) => group.items.length > 0);
}

// Compact, so titles keep the room: 5m, 3h, 2d, then the date.
export function relativeTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  const days = daysAgo(date, now);
  if (minutes < 1) return t('now');
  if (minutes < 60) return t('{n}m', { n: minutes });
  if (days <= 0) return t('{n}h', { n: Math.floor(minutes / 60) });
  if (days < 7) return t('{n}d', { n: days });
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
}

export function conversationTitle(conversation: AgentConversation): string {
  return conversation.title
    ? chatUtils.sanitizeTitle(conversation.title)
    : t('Untitled chat');
}

function daysAgo(date: Date, now: Date): number {
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOf(now) - startOf(date)) / 86_400_000);
}
