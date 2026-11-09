import { isNil, tryCatch } from '@activepieces/core-utils';
import { AgentConversation, SeekPage } from '@activepieces/shared';
import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { chatApi } from '@/features/chat/lib/chat-api';
import { chatUtils } from '@/features/chat/lib/chat-utils';

export function useChatHistory({ hidden }: { hidden: ReadonlySet<string> }) {
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

  const conversations = useMemo(
    () =>
      (query.data?.pages.flatMap((page) => page.data) ?? []).filter(
        (c) => !hidden.has(c.id),
      ),
    [query.data, hidden],
  );

  return { ...query, conversations };
}

export function useRenameChat() {
  const queryClient = useQueryClient();
  return useCallback(
    async ({ id, title }: { id: string; title: string }) => {
      patchList({
        queryClient,
        patch: (items) => items.map((c) => (c.id === id ? { ...c, title } : c)),
      });
      const { error } = await tryCatch(() =>
        chatApi.updateConversation(id, { title }),
      );
      if (error) {
        toast.error(t('Failed to rename conversation'));
      }
      queryClient.removeQueries({ queryKey: ['chat-conversation', id] });
      invalidate(queryClient);
    },
    [queryClient],
  );
}

export function useDeleteWithUndo() {
  const queryClient = useQueryClient();
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const pendingRef = useRef(new Map<string, PendingDelete>());

  const show = useCallback((id: string) => {
    setHidden((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }, []);

  const commit = useCallback(
    async (id: string) => {
      if (!pendingRef.current.delete(id)) return;
      patchList({
        queryClient,
        patch: (items) => items.filter((c) => c.id !== id),
      });
      show(id);
      const { error } = await tryCatch(() => chatApi.deleteConversation(id));
      if (error) {
        toast.error(t('Failed to delete conversation'));
      }
      queryClient.removeQueries({ queryKey: ['chat-conversation', id] });
      invalidate(queryClient);
    },
    [show, queryClient],
  );

  const undo = useCallback(
    (id: string) => {
      const pending = pendingRef.current.get(id);
      if (isNil(pending)) return;
      pendingRef.current.delete(id);
      show(id);
      pending.onUndo?.();
    },
    [show],
  );

  const remove = useCallback(
    ({ id, onUndo }: { id: string; onUndo?: () => void }) => {
      setHidden((ids) => new Set(ids).add(id));
      const toastId = toast(t('Chat deleted.'), {
        duration: UNDO_MS,
        action: { label: t('Undo'), onClick: () => undo(id) },
        onAutoClose: () => {
          commit(id).catch(() => undefined);
        },
        onDismiss: () => {
          commit(id).catch(() => undefined);
        },
      });
      pendingRef.current.set(id, { toastId, onUndo });
    },
    [commit, undo],
  );

  useEffect(() => {
    const pending = pendingRef.current;
    return () => {
      for (const [id, { toastId }] of Array.from(pending)) {
        commit(id).catch(() => undefined);
        toast.dismiss(toastId);
      }
    };
  }, [commit]);

  return { hidden, remove };
}

function groupByDate({
  conversations,
  now = new Date(),
}: {
  conversations: AgentConversation[];
  now?: Date;
}): HistoryGroup[] {
  const groups: HistoryGroup[] = [
    { label: t('Today'), items: [] },
    { label: t('Yesterday'), items: [] },
    { label: t('Previous 7 days'), items: [] },
    { label: t('Older'), items: [] },
  ];
  const today = dayjs(now).startOf('day');
  for (const conversation of conversations) {
    const days = today.diff(dayjs(conversation.created).startOf('day'), 'day');
    const index = days <= 0 ? 0 : days === 1 ? 1 : days <= 7 ? 2 : 3;
    groups[index].items.push(conversation);
  }
  return groups.filter((group) => group.items.length > 0);
}

function titleOf(conversation: AgentConversation): string {
  return conversation.title
    ? chatUtils.sanitizeTitle(conversation.title)
    : t('New conversation');
}

function patchList({
  queryClient,
  patch,
}: {
  queryClient: QueryClient;
  patch: (items: AgentConversation[]) => AgentConversation[];
}) {
  queryClient.setQueriesData<InfiniteData<SeekPage<AgentConversation>>>(
    { queryKey: LIST_KEY },
    (data) =>
      isNil(data)
        ? data
        : {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              data: patch(page.data),
            })),
          },
  );
}

function invalidate(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: LIST_KEY }).catch(() => undefined);
}

const LIST_KEY = ['chat-conversations', 'chat'];
const PAGE_SIZE = 50;
const UNDO_MS = 5000;

export const chatHistoryUtils = { groupByDate, titleOf };

type PendingDelete = { toastId: string | number; onUndo?: () => void };

export type HistoryGroup = {
  label: string;
  items: AgentConversation[];
};
