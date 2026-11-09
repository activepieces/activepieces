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
import { Ellipsis, Pencil, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { chatApi } from '@/features/chat/lib/chat-api';
import { chatHistoryUtils } from '@/features/chat/lib/chat-history-utils';
import {
  chatPendingDeletes,
  usePendingDeletes,
} from '@/features/chat/lib/chat-pending-deletes';
import { chatQueryKeys } from '@/features/chat/lib/chat-query-keys';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { useConversationIndicators } from '@/features/chat/lib/use-conversation-indicators';
import { cn } from '@/lib/utils';

export function ChatHistoryList({
  selectedId,
  onSelect,
  onCurrentDeleted,
  wide = false,
  className,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCurrentDeleted: () => void;
  wide?: boolean;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    isError,
    isSuccess,
    refetch,
    hasNextPage,
    isFetching,
    isFetchNextPageError,
    fetchNextPage,
  } = useInfiniteQuery<
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
  const all = useMemo(
    () =>
      (data?.pages.flatMap((page) => page.data) ?? []).filter(
        (conversation) => !pendingDeletes.has(conversation.id),
      ),
    [data, pendingDeletes],
  );

  const { getIndicator, markRead } = useConversationIndicators({
    conversations: all,
    activeId: selectedId,
    scope: 'chat',
    loaded: isSuccess,
  });

  const trimmedQuery = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      trimmedQuery
        ? all.filter((conversation) =>
            (conversation.title ?? '').toLowerCase().includes(trimmedQuery),
          )
        : all,
    [all, trimmedQuery],
  );
  const groups = chatHistoryUtils.groupByDay({
    conversations: shown,
    now: new Date(),
  });

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const remove = (id: string) => {
    const wasSelected = selectedIdRef.current === id;
    const bringBack = () => {
      if (wasSelected && !selectedIdRef.current) onSelect(id);
    };
    chatPendingDeletes.removeWithUndo({
      queryClient,
      id,
      onUndo: bringBack,
      onFailed: bringBack,
    });
    if (wasSelected) onCurrentDeleted();
  };

  const rename = async ({ id, title }: { id: string; title: string }) => {
    setRenamingId(null);
    const next = title.trim();
    const current = all.find((conversation) => conversation.id === id);
    if (!next || !current || next === current.title) return;
    setTitleInCaches({ queryClient, id, title: next });
    const { error } = await tryCatch(() =>
      chatApi.updateConversation(id, { title: next }),
    );
    if (error) {
      toast.error(t('Failed to rename conversation'));
      queryClient
        .invalidateQueries({ queryKey: chatQueryKeys.conversation(id) })
        .catch(() => undefined);
    }
    queryClient
      .invalidateQueries({ queryKey: chatQueryKeys.allConversationLists() })
      .catch(() => undefined);
  };

  const skippedLoadMoreRef = useRef(false);
  const loadMoreIfNearEnd = useCallback(() => {
    const el = listRef.current;
    const nearEnd =
      !!el &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - LOAD_MORE_OFFSET_PX;
    const wantsMore = nearEnd && hasNextPage;
    skippedLoadMoreRef.current = wantsMore && isFetching;
    if (wantsMore && !isFetching) {
      fetchNextPage().catch(() => undefined);
    }
  }, [hasNextPage, isFetching, fetchNextPage]);

  const fillsSearchResults = trimmedQuery.length > 0 && !isFetchNextPageError;
  useEffect(() => {
    const retriesSkipped = skippedLoadMoreRef.current && !isFetchNextPageError;
    if (fillsSearchResults || retriesSkipped) loadMoreIfNearEnd();
  }, [shown, loadMoreIfNearEnd, fillsSearchResults, isFetchNextPageError]);

  const searchShown = chatHistoryUtils.showsSearch({
    total: all.length,
    query,
  });

  return (
    <nav
      aria-label={t('Chat history')}
      className={cn('flex h-full min-h-0 flex-col', className)}
    >
      <div
        ref={listRef}
        onScroll={loadMoreIfNearEnd}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div
          className={cn(
            'flex w-full flex-col px-2 pt-1 pb-4',
            wide && 'mx-auto max-w-2xl px-4 pt-4',
          )}
        >
          {searchShown && (
            <label className="mb-1 flex h-9 shrink-0 cursor-text items-center gap-2 rounded-md px-3 text-gray-11 transition-colors duration-150 hover:bg-gray-3 focus-within:bg-gray-3">
              <Search className="size-4 shrink-0" />
              <input
                type="text"
                value={query}
                aria-label={t('Search chats')}
                placeholder={t('Search chats')}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape' && query) {
                    event.stopPropagation();
                    setQuery('');
                  }
                }}
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-gray-12 outline-hidden placeholder:text-gray-11"
              />
            </label>
          )}
          {isLoading ? (
            <HistorySkeleton />
          ) : isError && all.length === 0 ? (
            <DataFetchErrorState entity={t('chats')} onRetry={refetch} />
          ) : groups.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-11">
              {trimmedQuery ? t('No chats found') : t('No chats yet')}
            </p>
          ) : (
            groups.map((group) => (
              <section
                key={group.id}
                aria-label={group.label}
                className="flex flex-col"
              >
                <h3 className="px-3 pt-4 pb-1 text-xs font-medium text-gray-11">
                  {group.label}
                </h3>
                <ul className="flex flex-col gap-px">
                  {group.conversations.map((conversation) => (
                    <HistoryRow
                      key={conversation.id}
                      conversation={conversation}
                      selected={conversation.id === selectedId}
                      waiting={getIndicator(conversation) === 'waiting'}
                      renaming={renamingId === conversation.id}
                      onOpen={() => {
                        markRead(conversation.id);
                        onSelect(conversation.id);
                      }}
                      onStartRename={() => setRenamingId(conversation.id)}
                      onRename={(title) =>
                        rename({ id: conversation.id, title }).catch(
                          () => undefined,
                        )
                      }
                      onCancelRename={() => setRenamingId(null)}
                      onDelete={() => remove(conversation.id)}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </nav>
  );
}

function HistoryRow({
  conversation,
  selected,
  waiting,
  renaming,
  onOpen,
  onStartRename,
  onRename,
  onCancelRename,
  onDelete,
}: {
  conversation: AgentConversation;
  selected: boolean;
  waiting: boolean;
  renaming: boolean;
  onOpen: () => void;
  onStartRename: () => void;
  onRename: (title: string) => void;
  onCancelRename: () => void;
  onDelete: () => void;
}) {
  const title = conversation.title
    ? chatUtils.sanitizeTitle(conversation.title)
    : t('New conversation');
  const renameChosen = useRef(false);
  const cancelled = useRef(false);

  if (renaming) {
    return (
      <li className="flex h-9 items-center rounded-md bg-gray-3 px-3">
        <input
          autoFocus
          defaultValue={conversation.title ?? ''}
          aria-label={t('Chat title')}
          onFocus={(event) => event.currentTarget.select()}
          onBlur={(event) => {
            if (cancelled.current) {
              cancelled.current = false;
              onCancelRename();
              return;
            }
            onRename(event.currentTarget.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.currentTarget.blur();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              cancelled.current = true;
              event.currentTarget.blur();
            }
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-gray-12 outline-hidden"
        />
      </li>
    );
  }

  return (
    <li className="group relative">
      <button
        type="button"
        aria-current={selected ? 'true' : undefined}
        onClick={onOpen}
        className={cn(
          'flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-gray-12 outline-hidden transition-colors duration-150 hover:bg-gray-3 focus-visible:bg-gray-3 focus-visible:ring-2 focus-visible:ring-gray-8 group-has-[[data-state=open]]:bg-gray-3 [@media(hover:none)]:pr-10',
          selected &&
            'bg-gray-3 font-medium hover:bg-gray-4 focus-visible:bg-gray-4 group-has-[[data-state=open]]:bg-gray-4',
        )}
      >
        <TextWithTooltip tooltipMessage={title}>
          <span className="min-w-0 flex-1">{title}</span>
        </TextWithTooltip>
        <span className="flex shrink-0 items-center gap-2 text-xs font-normal text-gray-11 tabular-nums transition-opacity duration-150 group-hover:opacity-0 group-focus-within:opacity-0 group-has-[[data-state=open]]:opacity-0 [@media(hover:none)]:opacity-100">
          {waiting && (
            <span className="size-1.5 rounded-full bg-accent-10">
              <span className="sr-only">{t('Waiting for your input')}</span>
            </span>
          )}
          <time dateTime={conversation.created}>
            {chatHistoryUtils.shortTime({
              date: new Date(conversation.created),
              now: new Date(),
            })}
          </time>
        </span>
      </button>
      <div className="absolute inset-y-0 right-1 flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t('Chat actions')}
              className="pointer-events-none text-gray-11 opacity-0 transition-opacity duration-150 hover:bg-gray-4 hover:text-gray-12 focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 data-[state=open]:pointer-events-auto data-[state=open]:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100"
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40"
            onCloseAutoFocus={(event) => {
              if (!renameChosen.current) return;
              renameChosen.current = false;
              event.preventDefault();
            }}
          >
            <DropdownMenuItem
              onSelect={() => {
                renameChosen.current = true;
                onStartRename();
              }}
            >
              <Pencil />
              {t('Rename')}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 />
              {t('Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-px pt-4">
      {SKELETON_WIDTHS.map((width) => (
        <div key={width} className="flex h-9 items-center px-3">
          <Skeleton className={cn('h-3.5', width)} />
        </div>
      ))}
    </div>
  );
}

function setTitleInCaches({
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
  queryClient.setQueryData<AgentConversation | null>(
    chatQueryKeys.conversation(id),
    (cached) => (cached ? { ...cached, title } : cached),
  );
}

const PAGE_SIZE = 100;
const LOAD_MORE_OFFSET_PX = 200;
const SKELETON_WIDTHS = ['w-2/3', 'w-1/2', 'w-3/4', 'w-2/5'];
