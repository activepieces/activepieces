import { AgentConversation } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Ellipsis,
  MessageSquare,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { ConversationStatusDot } from '@/app/routes/chat-with-ai/components/conversation-status-dot';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ConversationIndicatorState,
  useConversationIndicators,
} from '@/features/chat/lib/use-conversation-indicators';
import { cn } from '@/lib/utils';

import {
  conversationTitle,
  groupByRecency,
  relativeTime,
  useChatHistory,
  useChatHistoryActions,
} from './chat-history-data';

// The panel's chat history: a search field over a grouped, keyboard-driven
// list. Docked, it fills the panel; floating, it sits in the header dropdown.
// Focus stays in the search field and the arrows move the highlight, like a
// command palette.
export function ChatHistoryList({
  currentId,
  onSelect,
  onNewChat,
  className,
}: {
  currentId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  className?: string;
}) {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(-1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
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
  } = useChatHistory();
  const { rename, remove } = useChatHistoryActions();
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
          conversationTitle(c).toLowerCase().includes(needle),
        )
      : conversations;
    return groupByRecency(matches);
  }, [conversations, query]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // Open on the current chat, so Enter right away is a no-op, not a jump.
  useEffect(() => {
    if (highlight === -1 && flat.length > 0) {
      const start = Math.max(
        0,
        flat.findIndex((c) => c.id === currentId),
      );
      setHighlight(start);
      // Wait for the dropdown to be placed and capped before scrolling it.
      const frame = requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          listRef.current
            ?.querySelector(`[data-index="${start}"]`)
            ?.scrollIntoView({ block: 'center' }),
        ),
      );
      return () => cancelAnimationFrame(frame);
    }
  }, [flat, currentId, highlight]);

  // The server has no search, so a search pulls the older pages in too.
  useEffect(() => {
    if (
      searching &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isFetchNextPageError
    ) {
      void fetchNextPage();
    }
  }, [
    searching,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  ]);

  const loadMoreNearEnd = () => {
    const el = listRef.current;
    if (
      el &&
      hasNextPage &&
      !isFetchingNextPage &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - LOAD_MORE_OFFSET_PX
    ) {
      void fetchNextPage();
    }
  };

  const moveHighlight = (delta: number) => {
    if (flat.length === 0) return;
    const next = Math.min(Math.max(highlight + delta, 0), flat.length - 1);
    setHighlight(next);
    listRef.current
      ?.querySelector(`[data-index="${next}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  };

  const open = (conversation: AgentConversation) => {
    markRead(conversation.id);
    onSelect(conversation.id);
  };

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveHighlight(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveHighlight(-1);
        break;
      case 'Enter': {
        const picked = flat[highlight];
        if (picked) {
          event.preventDefault();
          open(picked);
        }
        break;
      }
      case 'Escape':
        if (query) {
          event.preventDefault();
          event.stopPropagation();
          setQuery('');
          setHighlight(-1);
        }
        break;
    }
  };

  const activeOption = flat[highlight];
  let index = -1;

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="relative mx-3 mb-2 shrink-0">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-gray-10" />
        <input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlight(-1);
            listRef.current?.scrollTo({ top: 0 });
          }}
          onKeyDown={onSearchKeyDown}
          placeholder={t('Search chats')}
          aria-label={t('Search chats')}
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={
            activeOption ? `${listId}-${activeOption.id}` : undefined
          }
          className="h-8 w-full rounded-lg border border-gray-6 bg-transparent pr-8 pl-8 text-sm text-gray-12 transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-gray-10 hover:border-gray-7 focus-visible:border-gray-8 focus-visible:ring-2 focus-visible:ring-gray-8/10"
        />
        {query && (
          <button
            type="button"
            aria-label={t('Clear search')}
            onClick={() => {
              setQuery('');
              setHighlight(-1);
              inputRef.current?.focus();
            }}
            className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-gray-10 transition-colors duration-100 hover:bg-gray-4 hover:text-gray-12"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={t('Chat history')}
        onScroll={loadMoreNearEnd}
        className="min-h-0 flex-auto overflow-y-auto overscroll-contain px-2 pb-2"
      >
        {isLoading ? (
          <HistorySkeleton />
        ) : isError && conversations.length === 0 ? (
          <HistoryMessage
            title={t("Couldn't load your chats")}
            action={
              <Button variant="outline" size="xs" onClick={() => refetch()}>
                {t('Try again')}
              </Button>
            }
          />
        ) : conversations.length === 0 ? (
          <HistoryMessage
            icon
            title={t('No chats yet')}
            body={t('Your conversations will show up here.')}
            action={
              <Button variant="outline" size="xs" onClick={onNewChat}>
                {t('Start a chat')}
              </Button>
            }
          />
        ) : flat.length === 0 && !hasNextPage ? (
          <HistoryMessage
            title={t('No matches')}
            body={t('No chat title contains “{query}”.', {
              query: query.trim(),
            })}
          />
        ) : (
          groups.map((group) => (
            <div key={group.label} role="group" aria-label={group.label}>
              <div className="px-2 pt-3 pb-1 text-xs font-medium text-gray-10 first:pt-1">
                {group.label}
              </div>
              {group.items.map((conversation) => {
                index += 1;
                const rowIndex = index;
                return editingId === conversation.id ? (
                  <RenameRow
                    key={conversation.id}
                    initial={conversation.title ?? ''}
                    onDone={(title) => {
                      setEditingId(null);
                      inputRef.current?.focus();
                      const next = title?.trim();
                      if (next && next !== conversation.title) {
                        void rename(conversation.id, next);
                      }
                    }}
                  />
                ) : (
                  <HistoryRow
                    key={conversation.id}
                    id={`${listId}-${conversation.id}`}
                    index={rowIndex}
                    conversation={conversation}
                    highlighted={rowIndex === highlight}
                    current={conversation.id === currentId}
                    indicator={getIndicator(conversation)}
                    onHover={() => setHighlight(rowIndex)}
                    onOpen={() => open(conversation)}
                    onRename={() => setEditingId(conversation.id)}
                    onDelete={() => {
                      void remove(conversation.id);
                      if (conversation.id === currentId) onNewChat();
                      inputRef.current?.focus();
                    }}
                  />
                );
              })}
            </div>
          ))
        )}
        {isFetchingNextPage && (
          <div className="flex flex-col gap-1 px-2 pt-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="mt-3 h-4 w-2/5" />
          </div>
        )}
      </div>
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
  onHover,
  onOpen,
  onRename,
  onDelete,
}: {
  id: string;
  index: number;
  conversation: AgentConversation;
  highlighted: boolean;
  current: boolean;
  indicator: ConversationIndicatorState | null;
  onHover: () => void;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div
      id={id}
      data-index={index}
      role="option"
      aria-selected={highlighted}
      aria-current={current || undefined}
      onMouseMove={highlighted ? undefined : onHover}
      onClick={onOpen}
      className={cn(
        'relative flex h-9 cursor-pointer items-center gap-2 rounded-lg pr-1 pl-3 text-sm transition-colors duration-100 active:bg-gray-4',
        (highlighted || menuOpen) && 'bg-gray-3',
      )}
    >
      {current && (
        <span
          aria-hidden
          className="absolute top-1/2 left-1 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent-9"
        />
      )}
      <span
        title={conversationTitle(conversation)}
        className={cn(
          'min-w-0 flex-1 truncate',
          conversation.title ? 'text-gray-12' : 'text-gray-11',
          current && 'font-medium',
        )}
      >
        {conversationTitle(conversation)}
      </span>
      {indicator && <ConversationStatusDot state={indicator} />}
      <span className="relative flex h-7 min-w-7 shrink-0 items-center justify-end">
        <time
          dateTime={conversation.updated}
          title={new Date(conversation.updated).toLocaleString()}
          className={cn(
            'pr-1.5 text-xs text-gray-10 tabular-nums transition-opacity duration-100',
            (highlighted || menuOpen) && 'opacity-0',
          )}
        >
          {relativeTime(conversation.updated)}
        </time>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t('Chat actions')}
              onClick={(event) => event.stopPropagation()}
              className={cn(
                'absolute right-0 text-gray-11 opacity-0 transition-opacity duration-100 focus-visible:opacity-100',
                highlighted && 'opacity-100',
                menuOpen && 'bg-gray-4 opacity-100',
              )}
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-36"
            onClick={(event) => event.stopPropagation()}
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            <DropdownMenuItem onSelect={onRename}>
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
      </span>
    </div>
  );
}

function RenameRow({
  initial,
  onDone,
}: {
  initial: string;
  onDone: (title: string | null) => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);
  const finish = (title: string | null) => {
    if (done.current) return;
    done.current = true;
    onDone(title);
  };

  // The menu hands focus back as it closes; take it after that.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <input
      ref={ref}
      value={value}
      aria-label={t('Rename chat')}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => finish(value)}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === 'Enter') finish(value);
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          finish(null);
        }
      }}
      className="h-9 w-full rounded-lg border border-gray-8 bg-transparent px-3 text-sm text-gray-12 outline-none focus-visible:ring-[3px] focus-visible:ring-gray-8/20"
    />
  );
}

function HistorySkeleton() {
  return (
    <div aria-hidden className="flex flex-col px-2 pt-1">
      <Skeleton className="mb-3 h-3 w-12" />
      {SKELETON_WIDTHS.map((width, i) => (
        <div key={i} className="flex h-9 items-center justify-between gap-6">
          <Skeleton className="h-3.5" style={{ width }} />
          <Skeleton className="h-3 w-6" />
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
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {icon && (
        <span className="mb-3 flex size-9 items-center justify-center rounded-full bg-gray-3 text-gray-11">
          <MessageSquare className="size-4" />
        </span>
      )}
      <p className="text-sm font-medium text-gray-12">{title}</p>
      {body && <p className="mt-1 text-xs text-balance text-gray-11">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const LOAD_MORE_OFFSET_PX = 160;
const SKELETON_WIDTHS = ['72%', '54%', '64%', '40%', '58%', '48%'];
