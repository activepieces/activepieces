import { AgentConversation } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Ellipsis, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Dot } from '@/components/custom/dot';
import { SearchInput } from '@/components/custom/search-input';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  chatConversations,
  useChatConversations,
} from '@/features/chat/lib/chat-conversations';
import {
  chatHistoryUtils,
  OlderChats,
} from '@/features/chat/lib/chat-history-utils';
import { chatPendingDeletes } from '@/features/chat/lib/chat-pending-deletes';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { useConversationIndicators } from '@/features/chat/lib/use-conversation-indicators';
import { cn } from '@/lib/utils';

import { ChatTitleEditor } from './chat-title-editor';

export function ChatHistoryList({
  selectedId,
  onSelect,
  onCurrentDeleted,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCurrentDeleted: () => void;
}) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [refocusId, setRefocusId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    conversations: all,
    isLoading,
    isError,
    isSuccess,
    refetch,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = useChatConversations();

  const { getIndicator, markRead } = useConversationIndicators({
    conversations: all,
    activeId: selectedId,
    scope: 'chat',
    loaded: isSuccess,
  });

  const searching = query.trim().length > 0;
  const shown = useMemo(
    () => chatHistoryUtils.filterByTitle({ conversations: all, query }),
    [all, query],
  );
  const groups = chatHistoryUtils.groupByDay({
    conversations: shown,
    now: new Date(),
  });

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const remove = (id: string) => {
    const wasSelected = selectedIdRef.current === id;
    const bringBack = () => {
      if (wasSelected && mountedRef.current && !selectedIdRef.current) {
        onSelect(id);
      }
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
    await chatConversations.rename({
      queryClient,
      id,
      title: next,
      previousTitle: current.title ?? null,
    });
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

  useEffect(() => {
    if (skippedLoadMoreRef.current && !isFetchNextPageError) {
      loadMoreIfNearEnd();
    }
  }, [shown, loadMoreIfNearEnd, isFetchNextPageError]);

  const older = chatHistoryUtils.olderChats({
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  });
  const loadOlder = () => {
    fetchNextPage().catch(() => undefined);
  };

  const searchShown = chatHistoryUtils.showsSearch({
    total: all.length,
    query,
  });

  return (
    <nav
      aria-label={t('Chat history')}
      className="flex h-full min-h-0 flex-col"
    >
      <div
        ref={listRef}
        onScroll={loadMoreIfNearEnd}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="flex w-full flex-col px-2 pt-1 pb-4">
          {searchShown && (
            <div className="mx-1 mb-2">
              <SearchInput
                value={query}
                aria-label={t('Search chats')}
                placeholder={t('Search chats')}
                onChange={setQuery}
                onKeyDown={(event) => {
                  if (event.key === 'Escape' && query) {
                    event.stopPropagation();
                    setQuery('');
                  }
                }}
              />
            </div>
          )}
          {isLoading ? (
            <HistorySkeleton />
          ) : isError && all.length === 0 ? (
            <DataFetchErrorState entity={t('chats')} onRetry={refetch} />
          ) : groups.length === 0 && older !== 'loading' ? (
            <p className="px-3 py-2 text-sm text-gray-11">
              {searching ? t('No chats found') : t('No chats yet')}
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
                      refocus={refocusId === conversation.id}
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
                      onCancelRename={(endedByKey) => {
                        setRenamingId(null);
                        setRefocusId(endedByKey ? conversation.id : null);
                      }}
                      onDelete={() => remove(conversation.id)}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
          {!isLoading && (
            <OlderChatsRow
              state={older}
              searching={searching}
              onLoad={loadOlder}
            />
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
  refocus,
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
  refocus: boolean;
  onOpen: () => void;
  onStartRename: () => void;
  onRename: (title: string) => void;
  onCancelRename: (endedByKey: boolean) => void;
  onDelete: () => void;
}) {
  const title = chatUtils.displayTitle(conversation.title);
  const renameChosen = useRef(false);

  if (renaming) {
    return (
      <li>
        <ChatTitleEditor
          title={conversation.title ?? ''}
          className="flex h-9 items-center rounded-md bg-gray-3 px-3 text-sm text-gray-12"
          onRename={onRename}
          onDone={onCancelRename}
        />
      </li>
    );
  }

  return (
    <li className="group relative">
      <Button
        variant="ghost"
        autoFocus={refocus}
        aria-current={selected ? 'true' : undefined}
        onClick={onOpen}
        className={cn(
          'flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-gray-12 outline-hidden transition-colors duration-(--dur-micro) ease-[ease] hover:bg-gray-3 focus-visible:bg-gray-3 focus-visible:ring-2 focus-visible:ring-gray-8 group-has-[[data-state=open]]:bg-gray-3 [@media(hover:none)]:pr-10',
          selected &&
            'bg-gray-3 hover:bg-gray-4 focus-visible:bg-gray-4 group-has-[[data-state=open]]:bg-gray-4',
        )}
      >
        <TextWithTooltip tooltipMessage={title}>
          <span className="min-w-0 flex-1">{title}</span>
        </TextWithTooltip>
        <span className="flex shrink-0 items-center gap-2 text-xs font-normal text-gray-11 tabular-nums transition-opacity duration-(--dur-micro) ease-[ease] group-hover:opacity-0 group-focus-within:opacity-0 group-has-[[data-state=open]]:opacity-0 [@media(hover:none)]:opacity-100">
          {waiting && (
            <Dot variant="primary" className="size-1.5">
              <span className="sr-only">{t('Waiting for your input')}</span>
            </Dot>
          )}
          <time dateTime={conversation.updated}>
            {chatHistoryUtils.shortTime({
              date: chatHistoryUtils.lastActivity(conversation),
              now: new Date(),
            })}
          </time>
        </span>
      </Button>
      <div className="absolute inset-y-0 right-1 flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t('Chat actions')}
              className="pointer-events-none text-gray-11 opacity-0 transition-opacity duration-(--dur-micro) ease-[ease] hover:bg-gray-4 hover:text-gray-12 focus-visible:pointer-events-auto focus-visible:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 data-[state=open]:pointer-events-auto data-[state=open]:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100"
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

function OlderChatsRow({
  state,
  searching,
  onLoad,
}: {
  state: OlderChats;
  searching: boolean;
  onLoad: () => void;
}) {
  switch (state) {
    case 'none':
      return null;
    case 'loading':
      return <HistorySkeleton />;
    case 'available':
      return searching ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 justify-start text-gray-11"
          onClick={onLoad}
        >
          <Search />
          {t('Search older chats')}
        </Button>
      ) : null;
    case 'failed':
      return (
        <div
          role="alert"
          className="mt-2 flex items-center gap-2 px-3 text-sm text-gray-11"
        >
          <span className="min-w-0 flex-1">
            {t("Couldn't load older chats.")}
          </span>
          <Button variant="ghost" size="xs" onClick={onLoad}>
            <RefreshCw />
            {t('Retry')}
          </Button>
        </div>
      );
  }
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

const LOAD_MORE_OFFSET_PX = 200;
const SKELETON_WIDTHS = ['w-2/3', 'w-1/2', 'w-3/4', 'w-2/5'];
