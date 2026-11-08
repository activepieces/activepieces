import { tryCatch } from '@activepieces/core-utils';
import { AgentConversation, SeekPage } from '@activepieces/shared';
import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import i18next, { t } from 'i18next';
import { useCallback, useMemo } from 'react';
import { toast, type ToastT } from 'sonner';
import { create } from 'zustand';

import { chatApi } from '@/features/chat/lib/chat-api';
import { chatUtils } from '@/features/chat/lib/chat-utils';

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

  const hidden = usePendingDeletes((state) => state.ids);
  const conversations = useMemo(
    () =>
      (query.data?.pages.flatMap((page) => page.data) ?? [])
        .filter((c) => !hidden.has(c.id))
        .sort((a, b) => b.updated.localeCompare(a.updated)),
    [query.data, hidden],
  );

  return { ...query, conversations };
}

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
    queryFn: () =>
      conversationId ? chatApi.getConversation(conversationId) : null,
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
    queryClient
      .invalidateQueries({ queryKey: ['chat-conversations'] })
      .catch(() => undefined);
  }, [queryClient]);

  const rename = useCallback(
    async ({ id, title }: { id: string; title: string }) => {
      patchList((items) =>
        items.map((c) => (c.id === id ? { ...c, title } : c)),
      );
      const { error } = await tryCatch(() =>
        chatApi.updateConversation(id, { title }),
      );
      if (error) {
        toast.error(t('Failed to rename conversation'));
      } else {
        queryClient.removeQueries({ queryKey: ['chat-conversation', id] });
      }
      invalidate();
    },
    [patchList, invalidate, queryClient],
  );

  const remove = useCallback(
    ({
      id,
      onUndo,
      position,
    }: {
      id: string;
      onUndo?: () => void;
      position?: ToastT['position'];
    }) => {
      hidePending(id);
      let settled = false;
      const settle = () => {
        if (settled) return false;
        settled = true;
        window.removeEventListener('pagehide', commitOnExit);
        return true;
      };
      const commit = async () => {
        if (!settle()) return;
        const { error } = await tryCatch(() => chatApi.deleteConversation(id));
        if (error) {
          toast.error(t('Failed to delete conversation'));
        } else {
          patchList((items) => items.filter((c) => c.id !== id));
        }
        showPending(id);
        invalidate();
      };
      const commitOnExit = () => {
        if (!settle()) return;
        chatApi.deleteConversationOnExit(id);
      };
      window.addEventListener('pagehide', commitOnExit);
      toast(t('Chat deleted'), {
        duration: UNDO_MS,
        position,
        action: {
          label: t('Undo'),
          onClick: () => {
            if (!settle()) return;
            showPending(id);
            onUndo?.();
          },
        },
        onAutoClose: () => {
          commit().catch(() => undefined);
        },
        onDismiss: () => {
          commit().catch(() => undefined);
        },
      });
    },
    [patchList, invalidate],
  );

  return { rename, remove, invalidate };
}

export function groupByRecency({
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
  for (const conversation of conversations) {
    const days = daysAgo({ date: new Date(conversation.updated), now });
    const index = days <= 0 ? 0 : days === 1 ? 1 : days <= 7 ? 2 : 3;
    groups[index].items.push(conversation);
  }
  return groups.filter((group) => group.items.length > 0);
}

export function relativeTime({
  iso,
  now = new Date(),
}: {
  iso: string;
  now?: Date;
}): string {
  const date = new Date(iso);
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  const days = daysAgo({ date, now });
  const format = relativeFormat();
  if (minutes < 1) return format.auto.format(0, 'second');
  if (minutes < 60) return format.always.format(-minutes, 'minute');
  if (days <= 0) return format.always.format(-Math.floor(minutes / 60), 'hour');
  if (days < 7) return format.always.format(-days, 'day');
  return date.toLocaleDateString(i18next.language, {
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

function daysAgo({ date, now }: { date: Date; now: Date }): number {
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOf(now) - startOf(date)) / 86_400_000);
}

function relativeFormat(): RelativeFormat {
  const language = i18next.language;
  if (cachedFormat?.language !== language) {
    cachedFormat = {
      language,
      auto: new Intl.RelativeTimeFormat(language, {
        style: 'narrow',
        numeric: 'auto',
      }),
      always: new Intl.RelativeTimeFormat(language, { style: 'narrow' }),
    };
  }
  return cachedFormat;
}

function hidePending(id: string) {
  usePendingDeletes.setState(({ ids }) => ({ ids: new Set(ids).add(id) }));
}

function showPending(id: string) {
  usePendingDeletes.setState(({ ids }) => {
    if (!ids.has(id)) return { ids };
    const next = new Set(ids);
    next.delete(id);
    return { ids: next };
  });
}

const LIST_KEY = ['chat-conversations', 'chat'];
const PAGE_SIZE = 100;
const UNDO_MS = 5000;
const usePendingDeletes = create<{ ids: Set<string> }>(() => ({
  ids: new Set(),
}));
let cachedFormat: RelativeFormat | null = null;

export type HistoryGroup = {
  label: string;
  items: AgentConversation[];
};

type RelativeFormat = {
  language: string;
  auto: Intl.RelativeTimeFormat;
  always: Intl.RelativeTimeFormat;
};
