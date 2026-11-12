import { AgentConversation } from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ChevronDown,
  Ellipsis,
  Eye,
  EyeOff,
  History,
  Pencil,
  RefreshCw,
  Search,
  Settings,
  Trash2,
} from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { SettingsHubDialog } from '@/app/components/settings-hub/settings-hub-dialog';
import { Dot } from '@/components/custom/dot';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { chatApi } from '@/features/chat/lib/chat-api';
import {
  chatConversations,
  useChatConversations,
} from '@/features/chat/lib/chat-conversations';
import { chatDom } from '@/features/chat/lib/chat-dom';
import {
  chatHistoryUtils,
  OlderChats,
} from '@/features/chat/lib/chat-history-utils';
import { chatPendingDeletes } from '@/features/chat/lib/chat-pending-deletes';
import { chatQueryKeys } from '@/features/chat/lib/chat-query-keys';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { useConversationIndicators } from '@/features/chat/lib/use-conversation-indicators';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { cn } from '@/lib/utils';

import { ChatTitleEditor } from './chat-title-editor';

export function ChatSwitcher({
  conversationId,
  layout,
  typing,
  open,
  openedBy,
  onOpenChange,
  onSelect,
  onShowAll,
  onTitleEdited,
}: {
  conversationId: string | null;
  layout: ChatSwitcherLayout;
  typing: boolean;
  open: boolean;
  openedBy: ChatSwitcherOpener;
  onOpenChange: (change: {
    open: boolean;
    openedBy: ChatSwitcherOpener;
  }) => void;
  onSelect: (id: string) => void;
  onShowAll: () => void;
  onTitleEdited: () => void;
}) {
  const queryClient = useQueryClient();
  const { title, loading } = useConversationTitle({ conversationId });
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [refocusTitle, setRefocusTitle] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const opener = useRef<ChatSwitcherOpener>('pointer');
  const closeFocus = useRef<CloseFocus>('title');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const renaming = renamingId !== null && renamingId === conversationId;

  const close = (focus: CloseFocus) => {
    closeFocus.current = focus;
    onOpenChange({ open: false, openedBy });
  };

  const renameTitle = async (next: string) => {
    if (!conversationId || next === title) return;
    const cached = queryClient.getQueryData<AgentConversation | null>(
      chatQueryKeys.conversation(conversationId),
    );
    onTitleEdited();
    await chatConversations.rename({
      queryClient,
      id: conversationId,
      title: next,
      previousTitle: cached?.title ?? null,
    });
  };

  const deleteChat = () => {
    if (!conversationId) return;
    const id = conversationId;
    const bringBack = () => {
      if (useChatPanel.getState().conversationId) return;
      onSelect(id);
    };
    chatPendingDeletes.removeWithUndo({
      queryClient,
      id,
      onUndo: bringBack,
      onFailed: bringBack,
    });
    close('none');
    chatPanelUtils.startNewChat();
  };

  const shownTitle = chatUtils.displayTitle(title);
  const startRename = () => {
    setRefocusTitle(false);
    setRenamingId(conversationId);
  };
  const renameInput = (
    <ChatTitleEditor
      title={title ?? ''}
      className="flex h-8 min-w-0 max-w-md items-center rounded-md bg-gray-3 px-2 text-sm font-medium text-gray-12"
      onRename={(next) => {
        renameTitle(next).catch(() => undefined);
      }}
      onDone={(endedByKey) => {
        setRenamingId(null);
        setRefocusTitle(endedByKey);
      }}
    />
  );
  const titleText = loading ? (
    <Skeleton className="h-4 w-32" />
  ) : (
    <TextWithTooltip
      tooltipMessage={shownTitle}
      delayDuration={TITLE_TOOLTIP_DELAY_MS}
    >
      <span className="min-w-0">
        {title && typing ? <TypedText key={title} text={title} /> : shownTitle}
      </span>
    </TextWithTooltip>
  );

  if (layout === 'full') {
    return (
      <>
        <div className="flex min-w-0 items-center gap-1">
          {renaming ? (
            renameInput
          ) : (
            <h2 className="flex h-8 min-w-0 items-center px-1 text-sm font-medium text-gray-12">
              {titleText}
            </h2>
          )}
          <ChatActionsMenu
            hasChat={conversationId !== null}
            onRename={startRename}
            onStopFollowing={followAlong.stopFollowing}
            onSettings={() => setSettingsOpen(true)}
            onDelete={deleteChat}
          />
        </div>
        <SettingsHubDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </>
    );
  }

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(next) =>
          onOpenChange({ open: next, openedBy: opener.current })
        }
      >
        {renaming ? (
          renameInput
        ) : (
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              variant="ghost"
              autoFocus={refocusTitle}
              onClick={(event) => {
                opener.current = event.detail === 0 ? 'keyboard' : 'pointer';
              }}
              className="flex h-8 max-w-full min-w-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-gray-12 outline-hidden transition-colors duration-(--dur-micro) ease-[ease] hover:bg-gray-3 focus-visible:ring-2 focus-visible:ring-gray-8 active:bg-gray-5 data-[state=open]:bg-gray-4"
            >
              {titleText}
              <ChevronDown
                aria-hidden
                className="size-3.5 shrink-0 text-gray-10"
              />
            </Button>
          </PopoverTrigger>
        )}
        <PopoverAnchor
          aria-hidden
          className="pointer-events-none absolute inset-0"
        />
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={ANCHOR_SIDE_OFFSET_PX}
          alignOffset={ANCHOR_ALIGN_OFFSET_PX}
          data-chat-switcher=""
          data-opened-by={openedBy}
          aria-label={t('Switch chat')}
          onEscapeKeyDown={(event) => {
            chatDom.claimEscape(event);
            if (hasText(event.target)) return;
            close('title');
          }}
          onCloseAutoFocus={(event) => {
            const focus = closeFocus.current;
            closeFocus.current = 'title';
            if (focus === 'title') return;
            event.preventDefault();
            if (focus === 'composer') {
              (chatDom.composer() ?? triggerRef.current)?.focus();
            }
          }}
          className={cn(
            'flex max-h-[min(70vh,520px,var(--radix-popover-content-available-height))] flex-col overflow-hidden p-0',
            WIDTH_CLASS[layout],
          )}
        >
          <SwitcherMenu
            conversationId={conversationId}
            onPickChat={(id) => {
              close('composer');
              if (id !== conversationId) onSelect(id);
            }}
            onShowAll={() => {
              close('none');
              onShowAll();
            }}
            onRename={() => {
              close('none');
              startRename();
            }}
            onStopFollowing={() => {
              close('title');
              followAlong.stopFollowing();
            }}
            onSettings={() => {
              close('none');
              setSettingsOpen(true);
            }}
            onDelete={deleteChat}
          />
        </PopoverContent>
      </Popover>
      <SettingsHubDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

function ChatActionsMenu({
  hasChat,
  onRename,
  onStopFollowing,
  onSettings,
  onDelete,
}: {
  hasChat: boolean;
  onRename: () => void;
  onStopFollowing: () => void;
  onSettings: () => void;
  onDelete: () => void;
}) {
  const renameAfterClose = useRef(false);
  const autoFollow = useChatPanel((s) => s.autoFollow);
  const following = useFollowAlong((s) => s.phase === 'editing' && s.following);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('Chat actions')}
          className="text-gray-11 hover:text-gray-12 data-[state=open]:bg-gray-4 data-[state=open]:text-gray-12"
        >
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-60"
        onCloseAutoFocus={(event) => {
          if (!renameAfterClose.current) return;
          renameAfterClose.current = false;
          event.preventDefault();
          onRename();
        }}
      >
        {hasChat && (
          <DropdownMenuItem
            onSelect={() => {
              renameAfterClose.current = true;
            }}
          >
            <Pencil />
            {t('Rename')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() => useChatPanel.getState().setAutoFollow(!autoFollow)}
          className="items-start"
        >
          <Eye className="mt-0.5" />
          <FollowAlongLabel on={autoFollow} />
        </DropdownMenuItem>
        {autoFollow && following && (
          <DropdownMenuItem onSelect={onStopFollowing}>
            <EyeOff />
            {t('Stop following')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={onSettings}>
          <Settings />
          {t('Chat settings')}
        </DropdownMenuItem>
        {hasChat && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 />
              {t('Delete')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FollowAlongLabel({ on }: { on: boolean }) {
  return (
    <>
      <span className="flex min-w-0 flex-1 flex-col">
        <span>{t('Follow along')}</span>
        <span className="text-xs text-gray-11">
          {on
            ? t('Opens pages the AI edits.')
            : t('Doesn’t open pages for you.')}
        </span>
      </span>
      <span className="text-xs leading-5 text-gray-11">
        {on ? t('On') : t('Off')}
      </span>
    </>
  );
}

function SwitcherMenu({
  conversationId,
  onPickChat,
  onShowAll,
  onRename,
  onStopFollowing,
  onSettings,
  onDelete,
}: {
  conversationId: string | null;
  onPickChat: (id: string) => void;
  onShowAll: () => void;
  onRename: () => void;
  onStopFollowing: () => void;
  onSettings: () => void;
  onDelete: () => void;
}) {
  const [query, setQuery] = useState('');
  const [value, setValue] = useState(conversationId ?? '');
  const {
    conversations,
    isLoading,
    isSuccess,
    isError,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = useChatConversations();
  const { getIndicator, markRead } = useConversationIndicators({
    conversations,
    activeId: conversationId,
    scope: 'chat',
    loaded: isSuccess,
  });
  const [listShown, setListShown] = useState(!isLoading);
  if (!isLoading && !listShown) {
    setListShown(true);
    setValue(conversationId ?? '');
  }
  const autoFollow = useChatPanel((s) => s.autoFollow);
  const following = useFollowAlong((s) => s.phase === 'editing' && s.following);

  const searching = query.trim().length > 0;
  const older = searching
    ? chatHistoryUtils.olderChats({
        hasNextPage,
        isFetchingNextPage,
        isFetchNextPageError,
      })
    : 'none';
  const shown = searching
    ? chatHistoryUtils.filterByTitle({ conversations, query })
    : chatHistoryUtils.recentChats({
        conversations,
        currentId: conversationId,
        count: RECENT_COUNT,
      });
  const hasChat = conversationId !== null;
  const loadOlder = () => {
    fetchNextPage().catch(() => undefined);
  };

  const chatValues = [
    ...(isError && conversations.length === 0 ? [RETRY_LIST] : []),
    ...shown.map((conversation) => conversation.id),
    ...(!searching && conversations.length > 0 ? [ALL_CHATS] : []),
    ...(older === 'available' ? [SEARCH_OLDER] : []),
    ...(older === 'failed' ? [RETRY_OLDER] : []),
  ];
  const actionValues = searching
    ? []
    : [
        ...(hasChat ? [RENAME] : []),
        FOLLOW,
        ...(autoFollow && following ? [STOP_FOLLOWING] : []),
        SETTINGS,
        ...(hasChat ? [DELETE] : []),
      ];

  const pick = (id: string) => {
    markRead(id);
    onPickChat(id);
  };

  return (
    <Command
      label={t('Search chats')}
      shouldFilter={false}
      loop
      value={value}
      onValueChange={setValue}
      className="min-h-0 flex-1 rounded-none bg-transparent"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t('Search chats')}
        containerClassName="mx-2 mt-2 mb-1 h-8 shrink-0 rounded-lg border border-gray-8 bg-field px-2.5 transition-[border-color,box-shadow] duration-(--dur-micro) ease-[ease] focus-within:border-gray-9 focus-within:ring-[1px] focus-within:ring-gray-8/50"
        className="h-full"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setQuery('');
            return;
          }
          if (event.key !== 'Tab') return;
          event.preventDefault();
          const inActions = actionValues.includes(value);
          const target = inActions ? chatValues[0] : actionValues[0];
          if (target) setValue(target);
        }}
      />
      <CommandList className="max-h-none min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1">
        {isLoading ? (
          <RecentSkeleton />
        ) : isError && conversations.length === 0 ? (
          <CommandItem
            value={RETRY_LIST}
            onSelect={() => {
              refetch().catch(() => undefined);
            }}
            className="h-9"
          >
            <RefreshCw />
            {t("Couldn't load your chats. Try again")}
          </CommandItem>
        ) : shown.length > 0 ? (
          <CommandGroup heading={searching ? undefined : t('Recent')}>
            {shown.map((conversation) => (
              <ChatRow
                key={conversation.id}
                conversation={conversation}
                current={conversation.id === conversationId}
                waiting={getIndicator(conversation) === 'waiting'}
                onPick={() => pick(conversation.id)}
              />
            ))}
            {!searching && (
              <CommandItem
                value={ALL_CHATS}
                onSelect={onShowAll}
                className="h-9"
              >
                <History />
                {t('All chats…')}
              </CommandItem>
            )}
          </CommandGroup>
        ) : searching && older !== 'loading' ? (
          <p className="px-4 py-3 text-sm text-gray-11">
            {t('No chats match “{query}”', { query: query.trim() })}
          </p>
        ) : null}
        <OlderChatsItem state={older} onLoad={loadOlder} />
        {!searching && (
          <>
            {shown.length > 0 && <CommandSeparator />}
            <CommandGroup>
              {hasChat && (
                <CommandItem value={RENAME} onSelect={onRename} className="h-9">
                  <Pencil />
                  {t('Rename')}
                </CommandItem>
              )}
              <CommandItem
                value={FOLLOW}
                onSelect={() =>
                  useChatPanel.getState().setAutoFollow(!autoFollow)
                }
                className="min-h-9 items-start py-2"
              >
                <Eye className="mt-0.5" />
                <FollowAlongLabel on={autoFollow} />
              </CommandItem>
              {autoFollow && following && (
                <CommandItem
                  value={STOP_FOLLOWING}
                  onSelect={onStopFollowing}
                  className="h-9"
                >
                  <EyeOff />
                  {t('Stop following')}
                </CommandItem>
              )}
              <CommandItem
                value={SETTINGS}
                onSelect={onSettings}
                className="h-9"
              >
                <Settings />
                {t('Chat settings')}
              </CommandItem>
            </CommandGroup>
            {hasChat && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value={DELETE}
                    onSelect={onDelete}
                    className="h-9 text-danger-11 data-[selected=true]:text-danger-11 [&_svg:not([class*='text-'])]:text-danger-11"
                  >
                    <Trash2 />
                    {t('Delete')}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </Command>
  );
}

function ChatRow({
  conversation,
  current,
  waiting,
  onPick,
}: {
  conversation: AgentConversation;
  current: boolean;
  waiting: boolean;
  onPick: () => void;
}) {
  const title = chatUtils.displayTitle(conversation.title);
  return (
    <CommandItem
      value={conversation.id}
      onSelect={onPick}
      aria-current={current ? 'true' : undefined}
      className="h-9"
    >
      <span
        className={cn(
          'min-w-0 flex-1 truncate',
          current && 'font-medium text-gray-12',
        )}
      >
        {title}
      </span>
      {waiting && (
        <Dot variant="primary" className="size-1.5 shrink-0">
          <span className="sr-only">{t('Waiting for your input')}</span>
        </Dot>
      )}
      <time
        dateTime={conversation.updated}
        className="shrink-0 text-xs text-gray-11 tabular-nums"
      >
        {chatHistoryUtils.shortTime({
          date: chatHistoryUtils.lastActivity(conversation),
          now: new Date(),
        })}
      </time>
    </CommandItem>
  );
}

function OlderChatsItem({
  state,
  onLoad,
}: {
  state: OlderChats;
  onLoad: () => void;
}) {
  switch (state) {
    case 'none':
      return null;
    case 'loading':
      return <RecentSkeleton />;
    case 'available':
      return (
        <CommandGroup>
          <CommandItem value={SEARCH_OLDER} onSelect={onLoad} className="h-9">
            <Search />
            {t('Search older chats')}
          </CommandItem>
        </CommandGroup>
      );
    case 'failed':
      return (
        <CommandGroup>
          <CommandItem value={RETRY_OLDER} onSelect={onLoad} className="h-9">
            <RefreshCw />
            <span className="min-w-0 flex-1 truncate">
              {t("Couldn't load older chats.")}
            </span>
            <span className="text-xs text-gray-11">{t('Retry')}</span>
          </CommandItem>
        </CommandGroup>
      );
  }
}

function RecentSkeleton() {
  return (
    <div className="flex flex-col p-1.5">
      {SKELETON_WIDTHS.map((width) => (
        <div key={width} className="flex h-9 items-center gap-2 px-2">
          <span className="size-4 shrink-0" />
          <Skeleton className={cn('h-3.5', width)} />
        </div>
      ))}
    </div>
  );
}

function TypedText({ text }: { text: string }) {
  const reduced = useReducedMotion();
  const [alreadyTyped] = useState(() => typedTitles.has(text));
  const [typed, setTyped] = useState(0);
  const shown = reduced || alreadyTyped ? text.length : typed;

  useEffect(() => {
    if (reduced || alreadyTyped) return;
    typedTitles.add(text);
    const timer = setInterval(
      () =>
        setTyped((count) => {
          if (count >= text.length) clearInterval(timer);
          return Math.min(count + 1, text.length);
        }),
      Math.min(TYPE_STEP_MS, TYPE_TOTAL_MS / Math.max(1, text.length)),
    );
    return () => clearInterval(timer);
  }, [text, reduced, alreadyTyped]);

  return (
    <>
      <span aria-hidden>{text.slice(0, shown)}</span>
      <span className="sr-only">{text}</span>
    </>
  );
}

const typedTitles = new Set<string>();

function useConversationTitle({
  conversationId,
}: {
  conversationId: string | null;
}): { title: string | null; loading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: chatQueryKeys.conversation(conversationId),
    queryFn: () =>
      conversationId ? chatApi.getConversation(conversationId) : null,
    enabled: !!conversationId,
    staleTime: Infinity,
  });
  const title = data?.title ?? null;
  return {
    title: title ? chatUtils.sanitizeTitle(title) : null,
    loading: isLoading,
  };
}

function hasText(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement && target.value.length > 0;
}

const RECENT_COUNT = 6;
const TITLE_TOOLTIP_DELAY_MS = 500;
const ANCHOR_SIDE_OFFSET_PX = -8;
const ANCHOR_ALIGN_OFFSET_PX = 8;
const TYPE_STEP_MS = 24;
const TYPE_TOTAL_MS = 300;
const ALL_CHATS = 'switcher:all-chats';
const SEARCH_OLDER = 'switcher:search-older';
const RETRY_OLDER = 'switcher:retry-older';
const RETRY_LIST = 'switcher:retry-list';
const RENAME = 'switcher:rename';
const FOLLOW = 'switcher:follow-along';
const STOP_FOLLOWING = 'switcher:stop-following';
const SETTINGS = 'switcher:settings';
const DELETE = 'switcher:delete';
const SKELETON_WIDTHS = ['w-2/3', 'w-1/2', 'w-3/4'];
const WIDTH_CLASS: Record<Exclude<ChatSwitcherLayout, 'full'>, string> = {
  dock: 'w-[min(calc(var(--radix-popover-trigger-width)_-_16px),360px)]',
};

type CloseFocus = 'title' | 'composer' | 'none';

export type ChatSwitcherOpener = 'pointer' | 'keyboard';
type ChatSwitcherLayout = 'dock' | 'full';
