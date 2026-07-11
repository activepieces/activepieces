import { ChatConversation } from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ChevronDown,
  Maximize2,
  MessageCircle,
  SquarePen,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { chatApi } from '@/features/chat/lib/chat-api';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { useConversationIndicators } from '@/features/chat/lib/use-conversation-indicators';
import { cn } from '@/lib/utils';

import { ConversationStatusDot } from './conversation-status-dot';
import { DelayedTooltip } from './delayed-tooltip';

const RECENTS_LIMIT = 30;

// A deliberately plain list of recent chats for the app sidebar (rail popover + expanded).
// No search, no "new chat", no date grouping — new chats start from the rail's home icon and
// the chat panel header. Title and rows are flush-left; the status dot / delete action live on
// the right so nothing indents the chat names. Top/bottom fades hint at more content to scroll.
export function RecentsList({
  onSelect,
  selectedId,
  className,
  collapsible = false,
  surface = 'sidebar',
  onNewChat,
  onExpandSidebar,
}: {
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  className?: string;
  collapsible?: boolean;
  surface?: 'sidebar' | 'popover';
  onNewChat?: () => void;
  onExpandSidebar?: () => void;
}) {
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const { data: page, isLoading } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: () => chatApi.listConversations({ limit: 100 }),
  });

  const allConversations = page?.data ?? [];
  const { getIndicator, markRead } = useConversationIndicators({
    conversations: allConversations,
    activeId: selectedId ?? null,
  });

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const { mutate: deleteConv } = useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: (_data, deletedId) => {
      void queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      // If the open conversation was deleted, reset the panel to a fresh chat.
      if (selectedIdRef.current === deletedId) {
        window.dispatchEvent(new Event(chatUtils.newChatEvent));
      }
    },
  });

  const recents = allConversations.slice(0, RECENTS_LIMIT);

  const checkFades = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setShowTopFade(el.scrollTop > 4);
    setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  // Re-measure the fades when the content or available height changes (data loads,
  // section collapses, sidebar/window resizes).
  useEffect(() => {
    checkFades();
    const el = listRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => checkFades());
    observer.observe(el);
    return () => observer.disconnect();
  }, [checkFades, recents.length, collapsed, isLoading]);

  const handleClick = (conv: ChatConversation) => {
    markRead(conv.id);
    onSelect?.(conv.id);
  };

  const fadeFrom = surface === 'popover' ? 'from-popover' : 'from-sidebar';

  return (
    <div className={cn('flex min-h-0 flex-col gap-2 px-2 py-2', className)}>
      <div className="flex items-center gap-1 pr-1">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="group/head flex flex-1 items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-foreground/90 transition-colors hover:text-foreground"
          >
            <span className="flex-1 text-left">{t('My Chats')}</span>
            <ChevronDown
              className={cn(
                'size-3.5 shrink-0 text-muted-foreground opacity-0 transition-all duration-150 group-hover/head:opacity-100',
                collapsed && '-rotate-90',
              )}
            />
          </button>
        ) : (
          <span className="flex-1 px-2 py-1 text-sm font-semibold text-foreground/90">
            {t('My Chats')}
          </span>
        )}
        {onNewChat && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('New chat')}
                className="size-5 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={onNewChat}
              >
                <SquarePen className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('New chat')}</TooltipContent>
          </Tooltip>
        )}
        {onExpandSidebar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('Expand sidebar')}
                className="size-5 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={onExpandSidebar}
              >
                <Maximize2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Expand sidebar')}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {!collapsed && (
        <div className="relative flex min-h-0 flex-1 flex-col">
          {showTopFade && (
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b to-transparent',
                fadeFrom,
              )}
            />
          )}
          <div
            ref={listRef}
            onScroll={checkFades}
            className="min-h-0 flex-1 overflow-y-auto pb-1 scrollbar-thin"
          >
            {isLoading ? (
              <div className="flex flex-col gap-1 px-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-lg" />
                ))}
              </div>
            ) : recents.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <MessageCircle className="h-7 w-7 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {t('Start your first chat')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {recents.map((conv) => {
                  const indicator = getIndicator(conv);
                  return (
                    <button
                      type="button"
                      key={conv.id}
                      onClick={() => handleClick(conv)}
                      className={cn(
                        'group/chat flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-foreground/75 transition-colors hover:bg-muted hover:text-foreground',
                        selectedId === conv.id &&
                          'bg-muted font-medium text-foreground',
                      )}
                    >
                      <span className="flex-1 truncate">
                        {conv.title
                          ? chatUtils.sanitizeTitle(conv.title)
                          : t('New conversation')}
                      </span>
                      {indicator && (
                        <span className="flex shrink-0 items-center justify-center group-hover/chat:hidden">
                          <ConversationStatusDot state={indicator} />
                        </span>
                      )}
                      <DelayedTooltip>
                        <TooltipTrigger asChild>
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConv(conv.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.stopPropagation();
                                deleteConv(conv.id);
                              }
                            }}
                            className="hidden shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive group-hover/chat:flex"
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
            )}
          </div>
          {showBottomFade && (
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t to-transparent',
                fadeFrom,
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}
