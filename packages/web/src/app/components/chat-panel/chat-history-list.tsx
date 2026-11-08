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
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ToastT } from 'sonner';

import { ConversationStatusDot } from '@/app/routes/chat-with-ai/components/conversation-status-dot';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { inputClass } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ConversationIndicatorState,
  useConversationIndicators,
} from '@/features/chat/lib/use-conversation-indicators';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';
import { cn } from '@/lib/utils';

import {
  conversationTitle,
  groupByRecency,
  relativeTime,
  useChatHistory,
  useChatHistoryActions,
} from './chat-history-data';

export function ChatHistoryList({
  currentId,
  onSelect,
  onNewChat,
  toastPosition,
  autoFocus = true,
  className,
}: {
  currentId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  toastPosition?: ToastT['position'];
  autoFocus?: boolean;
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
  const [edges, setEdges] = useState({ top: false, bottom: false });
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

  const measureEdges = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const top = el.scrollTop > 0;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
    setEdges((prev) =>
      prev.top === top && prev.bottom === bottom ? prev : { top, bottom },
    );
  }, []);
  useLayoutEffect(measureEdges, [measureEdges, flat.length, isLoading]);

  useEffect(() => {
    if (highlight.index === -1 && flat.length > 0) {
      const start = Math.max(
        0,
        flat.findIndex((c) => c.id === currentId),
      );
      setHighlight({ index: start, by: null });
      if (start > 0) {
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            listRef.current
              ?.querySelector(`[data-index="${start}"]`)
              ?.scrollIntoView({ block: 'center' }),
          ),
        );
      }
    }
  }, [flat, currentId, highlight.index]);

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

  const onScroll = () => {
    measureEdges();
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
    const next = Math.min(
      Math.max(highlight.index + delta, 0),
      flat.length - 1,
    );
    setHighlight({ index: next, by: 'keyboard' });
    listRef.current
      ?.querySelector(`[data-index="${next}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  };

  const focusSearch = useCallback(() => inputRef.current?.focus(), []);

  const open = (conversation: AgentConversation) => {
    markRead(conversation.id);
    onSelect(conversation.id);
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
      case 'ContextMenu':
      case 'F10':
        if (picked && (event.key === 'ContextMenu' || event.shiftKey)) {
          event.preventDefault();
          setHighlight((h) => ({ ...h, by: 'keyboard' }));
          setMenuFor(picked.id);
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
      <div
        className={cn(
          'relative z-10 shrink-0 border-b bg-(--history-bg) px-3 pt-1 pb-2 transition-colors duration-150',
          edges.top ? 'border-gray-5' : 'border-transparent',
        )}
      >
        <Search className="pointer-events-none absolute top-[calc(50%-2px)] left-5.5 size-3.5 -translate-y-1/2 text-gray-10" />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlight({ index: -1, by: null });
            listRef.current?.scrollTo({ top: 0 });
          }}
          onKeyDown={onSearchKeyDown}
          placeholder={t('Search chats')}
          aria-label={t('Search chats')}
          aria-keyshortcuts="F2 Shift+F10"
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={
            activeOption && highlight.by
              ? `${listId}-${activeOption.id}`
              : undefined
          }
          className={cn(inputClass, 'h-8 pr-8 pl-8 shadow-none md:text-sm')}
        />
        {query && (
          <button
            type="button"
            aria-label={t('Clear search')}
            onClick={() => {
              setQuery('');
              setHighlight({ index: -1, by: null });
              focusSearch();
            }}
            className="absolute top-[calc(50%-2px)] right-4.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-gray-10 transition-colors duration-100 hover:bg-gray-4 hover:text-gray-12"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
      <div className="relative flex min-h-0 flex-auto flex-col">
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-8 right-2 left-0 z-[3] h-4 bg-linear-to-b from-(--history-bg) from-50% to-transparent transition-opacity duration-150',
            edges.top && !isLoading ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={t('Chat history')}
          onScroll={onScroll}
          onMouseLeave={() =>
            setHighlight((h) => (h.by === 'pointer' ? { ...h, by: null } : h))
          }
          className="min-h-0 flex-auto overflow-y-auto overscroll-contain px-2 pb-2"
          style={edges.bottom ? BOTTOM_FADE : undefined}
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
                <Button variant="outline" size="xs" onClick={() => onNewChat()}>
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
                <div className="sticky top-0 z-[2] -mx-2 h-8 bg-(--history-bg) px-4 pt-2.5 pb-1.5 text-xs font-medium text-gray-10">
                  {group.label}
                </div>
                {group.items.map((conversation) => {
                  index += 1;
                  const rowIndex = index;
                  const highlighted =
                    rowIndex === highlight.index ? highlight.by : null;
                  return editingId === conversation.id ? (
                    <RenameRow
                      key={conversation.id}
                      initial={conversation.title ?? ''}
                      onDone={(title) => {
                        setEditingId(null);
                        focusSearch();
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
                      highlighted={highlighted}
                      tabbable={rowIndex === highlight.index}
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
                      onDelete={() => {
                        const wasOpen = conversation.id === currentId;
                        remove(conversation.id, {
                          position: toastPosition,
                          onUndo: wasOpen
                            ? () => {
                                if (useChatPanel.getState().conversationId) {
                                  return;
                                }
                                onSelect(conversation.id);
                              }
                            : undefined,
                        });
                        if (wasOpen) onNewChat();
                        focusSearch();
                      }}
                      onMenuClosed={focusSearch}
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
    </div>
  );
}

const HistoryRow = memo(function HistoryRow({
  id,
  index,
  conversation,
  highlighted,
  tabbable,
  current,
  indicator,
  menuOpen,
  onMenuOpenChange,
  onHover,
  onOpen,
  onRename,
  onDelete,
  onMenuClosed,
}: HistoryRowProps) {
  const active = highlighted !== null || menuOpen;
  const renaming = useRef(false);
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
        'relative flex h-9 cursor-pointer items-center gap-2 rounded-lg pr-1 pl-3 text-sm transition-[background-color,box-shadow] duration-100 active:bg-gray-4',
        active && 'bg-gray-3',
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
        title={conversationTitle(conversation)}
        className={cn(
          'min-w-0 flex-1 truncate',
          conversation.title || current ? 'text-gray-12' : 'text-gray-11',
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
            active && 'opacity-0',
          )}
        >
          {relativeTime(conversation.updated)}
        </time>
        {(active || tabbable) && (
          <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                tabIndex={tabbable ? 0 : -1}
                aria-label={t('Chat actions')}
                onClick={(event) => event.stopPropagation()}
                className={cn(
                  'absolute right-0 text-gray-11 opacity-0 transition-opacity duration-100 hover:bg-gray-5 hover:text-gray-12 focus-visible:opacity-100',
                  active && 'opacity-100',
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
                <kbd className="ml-auto font-sans text-xs text-gray-10">F2</kbd>
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
        )}
      </span>
    </div>
  );
},
rowPropsEqual);

function rowPropsEqual(prev: HistoryRowProps, next: HistoryRowProps) {
  return (
    prev.id === next.id &&
    prev.index === next.index &&
    prev.conversation === next.conversation &&
    prev.highlighted === next.highlighted &&
    prev.tabbable === next.tabbable &&
    prev.current === next.current &&
    prev.indicator === next.indicator &&
    prev.menuOpen === next.menuOpen
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
      className={cn(inputClass, 'h-9 px-3 shadow-none md:text-sm')}
    />
  );
}

function HistorySkeleton() {
  return (
    <div aria-hidden className="flex flex-col px-2 pt-2.5">
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

type HistoryRowProps = {
  id: string;
  index: number;
  conversation: AgentConversation;
  highlighted: Highlight['by'];
  tabbable: boolean;
  current: boolean;
  indicator: ConversationIndicatorState | null;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  onHover: () => void;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMenuClosed: () => void;
};

type Highlight = { index: number; by: 'keyboard' | 'pointer' | null };

const BOTTOM_FADE: React.CSSProperties = {
  maskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent)',
};
const LOAD_MORE_OFFSET_PX = 160;
const SKELETON_WIDTHS = ['72%', '54%', '64%', '40%', '58%', '48%'];
