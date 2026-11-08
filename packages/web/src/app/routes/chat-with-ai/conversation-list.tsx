import { AgentConversation, SeekPage } from '@activepieces/shared';
import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ArrowUpRight,
  ChevronDown,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Trash2,
} from 'lucide-react';
import { useMemo, useState, useRef, useCallback, useEffect } from 'react';

import { SettingsHubDialog } from '@/app/components/settings-hub/settings-hub-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { chatApi } from '@/features/chat/lib/chat-api';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { useConversationIndicators } from '@/features/chat/lib/use-conversation-indicators';
import { cn } from '@/lib/utils';

import { ConversationStatusDot } from './components/conversation-status-dot';
import { ConversationsToggle } from './components/conversations-toggle';
import { DelayedTooltip } from './components/delayed-tooltip';

export function ConversationList({
  onSelect,
  onNewChat,
  selectedId,
  className,
  mobile = false,
  agentId,
  onCollapse,
}: {
  onSelect?: (id: string) => void;
  onNewChat?: () => void;
  selectedId?: string | null;
  className?: string;
  mobile?: boolean;
  agentId?: string;
  onCollapse?: () => void;
}) {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    data: conversationPages,
    isLoading: isLoadingConversations,
    isSuccess: conversationsLoaded,
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
    queryKey: ['chat-conversations', agentId ?? 'chat'],
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    queryFn: ({ pageParam }) =>
      chatApi.listConversations({
        limit: 100,
        cursor: pageParam,
        ...(agentId === undefined ? {} : { agentId }),
      }),
  });

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const { mutate: deleteConv } = useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: (_data, deletedId) => {
      void queryClient.invalidateQueries({
        queryKey: ['chat-conversations', agentId ?? 'chat'],
      });
      if (selectedIdRef.current === deletedId) {
        onNewChat?.();
      }
    },
  });

  const allConversations = useMemo(
    () => conversationPages?.pages.flatMap((page) => page.data) ?? [],
    [conversationPages],
  );

  const { getIndicator, markRead } = useConversationIndicators({
    conversations: allConversations,
    activeId: selectedId ?? null,
    scope: agentId ?? 'chat',
    loaded: conversationsLoaded,
  });

  const conversations = useMemo(() => {
    if (!searchQuery.trim()) return allConversations;
    const query = searchQuery.toLowerCase();
    return allConversations.filter((c) =>
      (c.title ?? '').toLowerCase().includes(query),
    );
  }, [allConversations, searchQuery]);

  const checkFades = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setShowTopFade(el.scrollTop > 5);
    setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 5);
  }, []);

  const skippedLoadMoreRef = useRef(false);

  const loadMoreIfNearEnd = useCallback(() => {
    const el = listRef.current;
    const nearListEnd =
      !!el &&
      el.scrollTop + el.clientHeight >= el.scrollHeight - LOAD_MORE_OFFSET_PX;
    const wantsMore = nearListEnd && hasNextPage;
    skippedLoadMoreRef.current = wantsMore && isFetching;
    if (wantsMore && !isFetching) {
      fetchNextPage().catch(() => undefined);
    }
  }, [hasNextPage, isFetching, fetchNextPage]);

  const fillsShortSearchResults =
    searchQuery.trim().length > 0 && !isFetchNextPageError;

  useEffect(() => {
    checkFades();
    const retriesSkippedScroll =
      skippedLoadMoreRef.current && !isFetchNextPageError;
    if (fillsShortSearchResults || retriesSkippedScroll) {
      loadMoreIfNearEnd();
    }
  }, [
    collapsed,
    conversations,
    checkFades,
    loadMoreIfNearEnd,
    fillsShortSearchResults,
    isFetchNextPageError,
  ]);

  const handleListScroll = useCallback(() => {
    checkFades();
    loadMoreIfNearEnd();
  }, [checkFades, loadMoreIfNearEnd]);

  const { today, yesterday, older } = useMemo(() => {
    const todayStr = new Date().toDateString();
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterdayStr = y.toDateString();

    const groups: {
      today: AgentConversation[];
      yesterday: AgentConversation[];
      older: AgentConversation[];
    } = {
      today: [],
      yesterday: [],
      older: [],
    };
    for (const c of conversations) {
      const dateStr = new Date(c.created).toDateString();
      if (dateStr === todayStr) groups.today.push(c);
      else if (dateStr === yesterdayStr) groups.yesterday.push(c);
      else groups.older.push(c);
    }
    return groups;
  }, [conversations]);

  const handleClick = (conv: AgentConversation) => {
    markRead(conv.id);
    onSelect?.(conv.id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConv(id);
  };

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderGroup = (label: string, items: AgentConversation[]) => {
    if (items.length === 0) return null;
    const isCollapsed = collapsed[label];
    return (
      <div className="mb-2 flex flex-col gap-px">
        <button
          type="button"
          className="flex items-center gap-0.5 rounded-md bg-transparent border-none cursor-pointer text-xs px-2 pt-2 pb-1 text-gray-11 transition-colors hover:text-gray-12"
          onClick={() => toggleGroup(label)}
        >
          {label}
          <ChevronDown
            size={10}
            className={cn(
              'shrink-0 transition-transform duration-150',
              isCollapsed && '-rotate-90',
            )}
          />
        </button>
        {!isCollapsed &&
          items.map((conv) => {
            const indicator = getIndicator(conv);
            const isSelected = selectedId === conv.id;
            return (
              <div key={conv.id} className="group relative">
                <button
                  type="button"
                  aria-current={isSelected ? 'page' : undefined}
                  className={cn(
                    'flex w-full cursor-pointer items-center rounded-md border-none bg-transparent px-2 py-1.5 text-left text-sm text-gray-11 transition-colors group-hover:bg-gray-3 group-hover:text-gray-12',
                    mobile && 'px-3 py-2.5',
                    indicator !== null && 'text-gray-12',
                    indicator === 'unread' && 'font-medium',
                    isSelected && 'bg-gray-3 text-gray-12',
                  )}
                  onClick={() => handleClick(conv)}
                >
                  <span
                    className={cn(
                      'flex-1 overflow-hidden text-ellipsis whitespace-nowrap pr-6',
                      mobile && 'pr-16',
                    )}
                  >
                    {conv.title
                      ? chatUtils.sanitizeTitle(conv.title)
                      : t('New conversation')}
                  </span>
                  {indicator && (
                    <span
                      className={cn(
                        'absolute right-2 top-1/2 -translate-y-1/2 transition-opacity group-hover:opacity-0',
                        mobile && 'right-10 group-hover:opacity-100',
                      )}
                    >
                      <ConversationStatusDot state={indicator} />
                    </span>
                  )}
                </button>
                <DelayedTooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={t('Delete')}
                      className={cn(
                        'absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-gray-11 opacity-0 outline-none transition-all hover:bg-danger-3 hover:text-danger-11 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-gray-8 group-hover:opacity-100',
                        mobile && 'opacity-100 p-1.5',
                      )}
                      onClick={(e) => handleDelete(e, conv.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    align="center"
                    className="pointer-events-none"
                  >
                    {t('Delete')}
                  </TooltipContent>
                </DelayedTooltip>
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full shrink-0 w-[220px]', className)}>
      <div className="flex items-center gap-1.5 px-2 pt-3 pb-1">
        <div className="relative min-w-0 grow">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-gray-11" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search chats')}
            aria-label={t('Search chats')}
            className={cn('h-8 pl-7 text-sm', mobile && 'h-9 pl-8 text-base')}
          />
        </div>
        <DelayedTooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size={mobile ? 'icon' : 'icon-sm'}
              aria-label={t('New chat')}
              className="shrink-0 text-gray-12"
              onClick={() => {
                onNewChat?.();
              }}
            >
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="pointer-events-none">
            <span className="flex items-center gap-2">
              {t('New chat')}
              <span className="opacity-60">⇧⌘O</span>
            </span>
          </TooltipContent>
        </DelayedTooltip>
        {onCollapse !== undefined && (
          <ConversationsToggle open onClick={onCollapse} />
        )}
      </div>
      <div className="flex-1 relative min-h-0">
        {showTopFade && (
          <div className="absolute top-0 left-0 right-0 h-5 pointer-events-none z-[1] bg-gradient-to-b from-gray-1 to-transparent" />
        )}
        <div
          ref={listRef}
          onScroll={handleListScroll}
          className="h-full overflow-y-auto px-2 pb-3"
        >
          {isLoadingConversations ? (
            <div className="space-y-2 px-2 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full rounded-md" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <MessageSquare className="h-8 w-8 text-gray-9 mb-2" />
              <p className="text-xs text-gray-11">
                {searchQuery.trim()
                  ? t('No chats found')
                  : t('Start your first chat')}
              </p>
            </div>
          ) : (
            <>
              {renderGroup(t('Today'), today)}
              {renderGroup(t('Yesterday'), yesterday)}
              {renderGroup(t('Older'), older)}
            </>
          )}
        </div>
        {showBottomFade && (
          <div className="absolute bottom-0 left-0 right-0 h-[70px] pointer-events-none z-[1] bg-gradient-to-t from-gray-1 to-transparent" />
        )}
      </div>
      {agentId === undefined && (
        <div className="shrink-0 border-t px-2 py-2">
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md bg-transparent cursor-pointer text-xs text-gray-12 transition-colors hover:bg-gray-4',
              mobile && 'px-3 py-2.5 text-sm',
            )}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={mobile ? 16 : 14} />
            {t('Settings')}
          </button>
        </div>
      )}
      {mobile && (
        <div className="shrink-0 border-t px-4 py-3">
          <p className="flex items-start gap-1.5 text-xs leading-snug text-gray-11">
            <ArrowUpRight size={14} className="mt-px shrink-0" />
            {t('Open on desktop for the full Activepieces experience.')}
          </p>
        </div>
      )}
      <SettingsHubDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

const LOAD_MORE_OFFSET_PX = 200;
