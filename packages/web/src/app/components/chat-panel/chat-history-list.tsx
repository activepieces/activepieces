import { AgentConversation } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Ellipsis,
  MessageSquare,
  Pencil,
  Settings,
  Trash2,
} from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { SettingsHubDialog } from '@/app/components/settings-hub/settings-hub-dialog';
import { ConversationStatusDot } from '@/app/routes/chat-with-ai/components/conversation-status-dot';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { inputClass } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ConversationIndicatorState,
  useConversationIndicators,
} from '@/features/chat/lib/use-conversation-indicators';
import { cn } from '@/lib/utils';

import {
  chatHistoryUtils,
  useChatHistory,
  useDeleteWithUndo,
} from './chat-history-data';
import { ChatRenameInput } from './chat-rename-input';

export function ChatHistoryList({
  currentId,
  onSelect,
  onNewChat,
  onLeaveCurrent,
  onRename,
  className,
}: {
  currentId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onLeaveCurrent: () => void;
  onRename: (params: { id: string; title: string }) => void;
  className?: string;
}) {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState<Highlight>({
    index: -1,
    by: null,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const currentIdRef = useRef(currentId);
  currentIdRef.current = currentId;
  const { hidden, remove } = useDeleteWithUndo();
  const {
    conversations,
    isLoading,
    isError,
    isSuccess,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = useChatHistory({ hidden });
  const { getIndicator, markRead } = useConversationIndicators({
    conversations,
    activeId: currentId,
    scope: 'chat',
    loaded: isSuccess,
  });

  const searching = query.trim().length > 0;
  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? conversations.filter((c) =>
          chatHistoryUtils.titleOf(c).toLowerCase().includes(needle),
        )
      : conversations;
    return chatHistoryUtils.groupByDate({ conversations: matches });
  }, [conversations, query]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useLayoutEffect(() => {
    if (highlight.index !== -1 || flat.length === 0) return;
    const start = Math.max(
      0,
      flat.findIndex((c) => c.id === currentId),
    );
    setHighlight({ index: start, by: null });
    revealRow({ list: listRef.current, index: start, center: true });
  }, [flat, currentId, highlight.index]);

  useEffect(() => {
    if (
      searching &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchNextPageError
    ) {
      fetchNextPage().catch(() => undefined);
    }
  }, [
    searching,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  ]);

  const onScroll = () => {
    const el = listRef.current;
    if (
      el &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchNextPageError &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - LOAD_MORE_OFFSET_PX
    ) {
      fetchNextPage().catch(() => undefined);
    }
  };

  const moveHighlight = (delta: number) => {
    if (flat.length === 0) return;
    const next = Math.min(
      Math.max(highlight.index + delta, 0),
      flat.length - 1,
    );
    setHighlight({ index: next, by: 'keyboard' });
    revealRow({ list: listRef.current, index: next, center: false });
  };

  const focusSearch = () => inputRef.current?.focus();

  const open = (conversation: AgentConversation) => {
    markRead(conversation.id);
    onSelect(conversation.id);
  };

  const deleteChat = (conversation: AgentConversation) => {
    const wasOpen = conversation.id === currentId;
    remove({
      id: conversation.id,
      onUndo: wasOpen
        ? () => {
            if (currentIdRef.current === null) onSelect(conversation.id);
          }
        : undefined,
    });
    if (wasOpen) onLeaveCurrent();
    focusSearch();
  };

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    const picked = flat[highlight.index];
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveHighlight(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveHighlight(-1);
        break;
      case 'Home':
      case 'End':
        if (!query) {
          event.preventDefault();
          moveHighlight(event.key === 'Home' ? -flat.length : flat.length);
        }
        break;
      case 'Enter':
        if (picked) {
          event.preventDefault();
          open(picked);
        }
        break;
      case 'F2':
        if (picked) {
          event.preventDefault();
          setEditingId(picked.id);
        }
        break;
      case 'Delete':
        if (picked && event.shiftKey) {
          event.preventDefault();
          deleteChat(picked);
        }
        break;
      case 'Escape':
        if (query) {
          event.preventDefault();
          event.stopPropagation();
          setQuery('');
          setHighlight({ index: -1, by: null });
        }
        break;
    }
  };

  const activeOption = flat[highlight.index];
  let index = -1;

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex shrink-0 px-3 pt-1 pb-2">
        <SearchInput
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(next) => {
            setQuery(next);
            setHighlight({ index: -1, by: null });
            listRef.current?.scrollTo({ top: 0 });
          }}
          onKeyDown={onSearchKeyDown}
          placeholder={t('Search chats')}
          aria-label={t('Search chats')}
          aria-keyshortcuts="ArrowUp ArrowDown Enter F2 Shift+Delete"
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={
            activeOption && highlight.by
              ? `${listId}-${activeOption.id}`
              : undefined
          }
        />
      </div>
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={t('Chat history')}
        onScroll={onScroll}
        onMouseLeave={() =>
          setHighlight((h) => (h.by === 'pointer' ? { ...h, by: null } : h))
        }
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-2"
      >
        {isLoading ? (
          <HistorySkeleton />
        ) : isError && conversations.length === 0 ? (
          <HistoryMessage
            title={t("Couldn't load your chats.")}
            action={
              <Button variant="outline" size="xs" onClick={() => refetch()}>
                {t('Try again')}
              </Button>
            }
          />
        ) : conversations.length === 0 ? (
          <HistoryMessage
            icon
            title={t('No chats yet.')}
            body={t('Your conversations will show up here.')}
            action={
              <Button variant="outline" size="xs" onClick={onNewChat}>
                {t('Start a chat')}
              </Button>
            }
          />
        ) : flat.length === 0 && !hasNextPage ? (
          <HistoryMessage
            title={t('No matches.')}
            body={t('No chat title contains “{query}”.', {
              query: query.trim(),
            })}
          />
        ) : (
          groups.map((group) => (
            <div key={group.label} role="group" aria-label={group.label}>
              <div className="sticky top-0 z-[2] -mx-2 h-8 bg-gray-1 px-4 pt-2.5 pb-1.5 text-xs font-medium text-gray-10">
                {group.label}
              </div>
              {group.items.map((conversation) => {
                index += 1;
                const rowIndex = index;
                return editingId === conversation.id ? (
                  <ChatRenameInput
                    key={conversation.id}
                    label={t('Rename chat')}
                    className={cn(
                      inputClass,
                      'h-9 px-3 shadow-none md:text-sm',
                    )}
                    initial={conversation.title ?? ''}
                    onDone={(title) => {
                      setEditingId(null);
                      focusSearch();
                      const next = title?.trim();
                      if (next && next !== conversation.title) {
                        onRename({ id: conversation.id, title: next });
                      }
                    }}
                  />
                ) : (
                  <HistoryRow
                    key={conversation.id}
                    id={`${listId}-${conversation.id}`}
                    index={rowIndex}
                    conversation={conversation}
                    highlighted={
                      rowIndex === highlight.index ? highlight.by : null
                    }
                    current={conversation.id === currentId}
                    indicator={getIndicator(conversation)}
                    menuOpen={menuFor === conversation.id}
                    onMenuOpenChange={(next) =>
                      setMenuFor(next ? conversation.id : null)
                    }
                    onHover={() =>
                      setHighlight({ index: rowIndex, by: 'pointer' })
                    }
                    onOpen={() => open(conversation)}
                    onRename={() => setEditingId(conversation.id)}
                    onDelete={() => deleteChat(conversation)}
                    onMenuClosed={focusSearch}
                  />
                );
              })}
            </div>
          ))
        )}
        {isFetchingNextPage && (
          <div aria-hidden className="flex flex-col gap-3 px-3 pt-3">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3.5 w-2/5" />
          </div>
        )}
        {isFetchNextPageError && (
          <div className="flex items-center justify-between gap-2 px-3 pt-3 text-xs text-gray-11">
            {t("Couldn't load more chats.")}
            <Button
              variant="outline"
              size="xs"
              onClick={() => fetchNextPage().catch(() => undefined)}
            >
              {t('Try again')}
            </Button>
          </div>
        )}
      </div>
      <div className="shrink-0 border-t px-2 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-12"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="size-4" />
          {t('Settings')}
        </Button>
      </div>
      <SettingsHubDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

function HistoryRow({
  id,
  index,
  conversation,
  highlighted,
  current,
  indicator,
  menuOpen,
  onMenuOpenChange,
  onHover,
  onOpen,
  onRename,
  onDelete,
  onMenuClosed,
}: {
  id: string;
  index: number;
  conversation: AgentConversation;
  highlighted: Highlight['by'];
  current: boolean;
  indicator: ConversationIndicatorState | null;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onHover: () => void;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMenuClosed: () => void;
}) {
  const renaming = useRef(false);
  const title = chatHistoryUtils.titleOf(conversation);
  return (
    <div
      id={id}
      data-index={index}
      role="option"
      aria-selected={highlighted !== null}
      aria-current={current || undefined}
      onMouseMove={highlighted === 'pointer' ? undefined : onHover}
      onClick={onOpen}
      onContextMenu={(event) => {
        event.preventDefault();
        onMenuOpenChange(true);
      }}
      className={cn(
        'relative flex h-9 cursor-pointer items-center gap-2 rounded-lg pr-1 pl-3 text-sm transition-colors duration-100 ease-move motion-reduce:transition-none',
        (highlighted !== null || menuOpen) && 'bg-gray-3',
        highlighted === 'keyboard' && 'ring-1 ring-gray-7 ring-inset',
      )}
    >
      {current && (
        <span
          aria-hidden
          className="absolute top-1/2 left-1 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent-9"
        />
      )}
      <span
        title={title}
        className={cn(
          'min-w-0 flex-1 truncate',
          conversation.title || current ? 'text-gray-12' : 'text-gray-11',
          current && 'font-medium',
        )}
      >
        {title}
      </span>
      {indicator && <ConversationStatusDot state={indicator} />}
      <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            tabIndex={-1}
            aria-label={t('Actions for {title}', { title })}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              'shrink-0 text-gray-11 hover:bg-gray-5 hover:text-gray-12',
              menuOpen && 'bg-gray-5 text-gray-12',
            )}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-36"
          onClick={(event) => event.stopPropagation()}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (!renaming.current) onMenuClosed();
            renaming.current = false;
          }}
        >
          <DropdownMenuItem
            onSelect={() => {
              renaming.current = true;
              onRename();
            }}
          >
            <Pencil className="size-4" />
            {t('Rename')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={onDelete}
            className="text-danger-11 focus:text-danger-11"
          >
            <Trash2 className="size-4" />
            {t('Delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function revealRow({
  list,
  index,
  center,
}: {
  list: HTMLElement | null;
  index: number;
  center: boolean;
}) {
  const row = list?.querySelector(`[data-index="${index}"]`);
  if (!list || !row) return;
  const box = list.getBoundingClientRect();
  const rect = row.getBoundingClientRect();
  const top = rect.top - box.top + list.scrollTop;
  if (center) {
    list.scrollTop = top - (list.clientHeight - rect.height) / 2;
  } else if (rect.top < box.top + GROUP_HEADER_PX) {
    list.scrollTop = top - GROUP_HEADER_PX;
  } else if (rect.bottom > box.bottom) {
    list.scrollTop = top + rect.height - list.clientHeight;
  }
}

function HistorySkeleton() {
  return (
    <div aria-hidden className="flex flex-col px-2 pt-2.5">
      <Skeleton className="mb-3 h-3 w-12" />
      {SKELETON_WIDTHS.map((width) => (
        <div key={width} className="flex h-9 items-center">
          <Skeleton className="h-3.5" style={{ width }} />
        </div>
      ))}
    </div>
  );
}

function HistoryMessage({
  icon,
  title,
  body,
  action,
}: {
  icon?: boolean;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <Empty className="flex-none gap-4 px-6 py-10 md:px-6 md:py-10">
      <EmptyHeader className="gap-1">
        {icon && (
          <EmptyMedia
            variant="icon"
            className="mb-2 size-9 rounded-full text-gray-11"
          >
            <MessageSquare className="size-4" />
          </EmptyMedia>
        )}
        <EmptyTitle className="text-sm font-medium text-gray-12">
          {title}
        </EmptyTitle>
        {body && (
          <EmptyDescription className="text-xs">{body}</EmptyDescription>
        )}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}

type Highlight = { index: number; by: 'keyboard' | 'pointer' | null };

const LOAD_MORE_OFFSET_PX = 160;
const GROUP_HEADER_PX = 32;
const SKELETON_WIDTHS = ['72%', '54%', '64%', '40%', '58%', '48%'];
