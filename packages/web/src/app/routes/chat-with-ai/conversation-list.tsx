import { ChatConversation } from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ArrowUpRight,
  ChevronDown,
  MessageSquare,
  Search,
  SquarePen,
  Trash2,
} from 'lucide-react';
import { useMemo, useState, useRef, useCallback, useEffect } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { chatApi } from '@/features/chat/lib/chat-api';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { useConversationIndicators } from '@/features/chat/lib/use-conversation-indicators';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { ConversationStatusDot } from './components/conversation-status-dot';
import { DelayedTooltip } from './components/delayed-tooltip';

const CONVERSATIONS_PAGE_SIZE = 20;

export function ConversationList({
  onSelect,
  onNewChat,
  selectedId,
  className,
  mobile = false,
  floating = false,
}: {
  onSelect?: (id: string) => void;
  onNewChat?: () => void;
  selectedId?: string | null;
  className?: string;
  mobile?: boolean;
  floating?: boolean;
}) {
  const queryClient = useQueryClient();
  const { platform } = platformHooks.useCurrentPlatform();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(CONVERSATIONS_PAGE_SIZE);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: conversationsPage, isLoading: isLoadingConversations } =
    useQuery({
      queryKey: ['chat-conversations'],
      queryFn: () => chatApi.listConversations({ limit: 100 }),
      enabled: platform.plan.chatEnabled,
    });

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const deleteConversation = async (id: string) => {
    await chatApi.deleteConversation(id);
    await queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    if (selectedIdRef.current === id) {
      onNewChat?.();
    }
  };

  const allConversations = conversationsPage?.data ?? [];

  const { getIndicator, markRead } = useConversationIndicators({
    conversations: allConversations,
    activeId: selectedId ?? null,
  });

  const conversations = useMemo(() => {
    if (!searchQuery.trim()) return allConversations;
    const query = searchQuery.toLowerCase();
    return allConversations.filter((c) =>
      (c.title ?? '').toLowerCase().includes(query),
    );
  }, [allConversations, searchQuery]);

  const visibleConversations = useMemo(
    () => conversations.slice(0, visibleCount),
    [conversations, visibleCount],
  );
  const hasMore = visibleCount < conversations.length;

  const checkFades = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setShowTopFade(el.scrollTop > 5);
    setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 5);
  }, []);

  useEffect(() => {
    checkFades();
  }, [collapsed, visibleConversations, checkFades]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = listRef.current;
    if (!sentinel || !root || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((count) => count + CONVERSATIONS_PAGE_SIZE);
        }
      },
      { root, rootMargin: '120px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore]);

  const { today, yesterday, older } = useMemo(() => {
    const todayStr = new Date().toDateString();
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yesterdayStr = y.toDateString();

    const groups: {
      today: ChatConversation[];
      yesterday: ChatConversation[];
      older: ChatConversation[];
    } = {
      today: [],
      yesterday: [],
      older: [],
    };
    for (const c of visibleConversations) {
      const dateStr = new Date(c.created).toDateString();
      if (dateStr === todayStr) groups.today.push(c);
      else if (dateStr === yesterdayStr) groups.yesterday.push(c);
      else groups.older.push(c);
    }
    return groups;
  }, [visibleConversations]);

  const handleClick = (conv: ChatConversation) => {
    markRead(conv.id);
    onSelect?.(conv.id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderGroup = (label: string, items: ChatConversation[]) => {
    if (items.length === 0) return null;
    const isCollapsed = collapsed[label];
    return (
      <div className="mb-4 flex flex-col gap-px">
        <button
          type="button"
          className="flex items-center gap-1 rounded-md bg-transparent border-none cursor-pointer text-[11px] font-semibold mb-1 px-3 py-1 uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-foreground"
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
            return (
              <button
                type="button"
                key={conv.id}
                className={cn(
                  'group flex items-center w-full px-3 py-1.5 rounded-lg bg-transparent border-none cursor-pointer text-left text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground relative',
                  mobile && 'py-2.5',
                  selectedId === conv.id &&
                    'bg-muted font-medium text-foreground',
                )}
                onClick={() => handleClick(conv)}
              >
                <span className="mr-2 flex h-1.5 w-1.5 shrink-0 items-center justify-center">
                  {indicator && <ConversationStatusDot state={indicator} />}
                </span>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap pr-5 flex-1">
                  {conv.title
                    ? chatUtils.sanitizeTitle(conv.title)
                    : t('New conversation')}
                </span>
                <DelayedTooltip>
                  <TooltipTrigger asChild>
                    <span
                      role="button"
                      tabIndex={0}
                      className={cn(
                        'absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all',
                        mobile && 'opacity-100 p-1.5',
                      )}
                      onClick={(e) => handleDelete(e, conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          setDeleteTargetId(conv.id);
                        }
                      }}
                    >
                      <Trash2 size={12} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    align="center"
                    className="pointer-events-none"
                  >
                    {t('Delete')}
                  </TooltipContent>
                </DelayedTooltip>
              </button>
            );
          })}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex flex-col min-h-0 w-[220px]',
        !floating && 'h-full',
        className,
      )}
    >
      <div className="px-2 pt-3 pb-2 space-y-2">
        <button
          type="button"
          className={cn(
            'flex items-center justify-between gap-1.5 w-full px-3 py-2 rounded-lg border border-border bg-transparent cursor-pointer text-sm font-medium text-foreground transition-colors hover:bg-accent',
            mobile && 'py-2.5',
          )}
          onClick={() => {
            onNewChat?.();
          }}
        >
          <span className="flex items-center gap-2">
            <SquarePen size={16} />
            {t('New chat')}
          </span>
          {!mobile && <span className="text-[11px] opacity-50">⇧⌘O</span>}
        </button>
        {allConversations.length > 5 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(CONVERSATIONS_PAGE_SIZE);
              }}
              placeholder={t('Search...')}
              className={cn(
                'h-8 pl-8 text-sm rounded-lg',
                mobile && 'h-9 text-base',
              )}
            />
          </div>
        )}
      </div>
      <div className="flex-1 relative min-h-0">
        {showTopFade && (
          <div
            className={cn(
              'absolute top-0 left-0 right-0 h-5 pointer-events-none z-[1] bg-gradient-to-b to-transparent',
              floating ? 'from-popover' : 'from-background',
            )}
          />
        )}
        <div
          ref={listRef}
          onScroll={checkFades}
          className={cn(
            'overflow-y-auto px-2 pb-3 scrollbar-thin',
            floating ? 'max-h-[65vh]' : 'h-full',
          )}
        >
          {isLoadingConversations ? (
            <div className="space-y-1 px-2 pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-lg" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
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
              {hasMore && <div ref={sentinelRef} className="h-4 w-full" />}
            </>
          )}
        </div>
        {showBottomFade && (
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 h-[70px] pointer-events-none z-[1] bg-gradient-to-t to-transparent',
              floating ? 'from-popover' : 'from-background',
            )}
          />
        )}
      </div>
      {mobile && (
        <div className="shrink-0 border-t px-4 py-3">
          <p className="flex items-start gap-1.5 text-xs leading-snug text-muted-foreground">
            <ArrowUpRight size={14} className="mt-px shrink-0" />
            {t('Open on desktop for the full Activepieces experience.')}
          </p>
        </div>
      )}

      <ConfirmationDeleteDialog
        open={deleteTargetId !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeleteTargetId(null);
          }
        }}
        title={t('Delete chat')}
        message={t(
          'Are you sure you want to delete this chat? This action cannot be undone.',
        )}
        entityName={t('Chat')}
        buttonText={t('Delete')}
        mutationFn={async () => {
          if (deleteTargetId) {
            await deleteConversation(deleteTargetId);
          }
        }}
      />
    </div>
  );
}
