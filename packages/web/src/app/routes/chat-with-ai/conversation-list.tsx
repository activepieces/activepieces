import { ChatConversation } from '@activepieces/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { chatApi } from '@/features/chat/lib/chat-api';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { DelayedTooltip } from './components/delayed-tooltip';

function isToday(dateStr: string) {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isYesterday(dateStr: string) {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return new Date(dateStr).toDateString() === y.toDateString();
}

export function ConversationList({
  onSelect,
  onNewChat,
  selectedId,
}: {
  onSelect?: (id: string) => void;
  onNewChat?: () => void;
  selectedId?: string | null;
}) {
  const queryClient = useQueryClient();
  const projectId = authenticationSession.getProjectId();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: conversationsPage, isLoading: isLoadingConversations } =
    useQuery({
      queryKey: ['chat-conversations', projectId],
      queryFn: () => chatApi.listConversations({ limit: 100 }),
    });

  const { mutate: deleteConv } = useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['chat-conversations', projectId],
      });
    },
  });

  const conversations = conversationsPage?.data ?? [];

  const checkFades = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setShowTopFade(el.scrollTop > 5);
    setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 5);
  }, []);

  useEffect(() => {
    checkFades();
  }, [collapsed, conversations, checkFades]);

  const today = conversations.filter((c) => isToday(c.created));
  const yesterdayList = conversations.filter((c) => isYesterday(c.created));
  const olderList = conversations.filter(
    (c) => !isToday(c.created) && !isYesterday(c.created),
  );

  const handleClick = (conv: ChatConversation) => {
    onSelect?.(conv.id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConv(id);
    if (selectedId === id) {
      onNewChat?.();
    }
  };

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderGroup = (label: string, items: ChatConversation[]) => {
    if (items.length === 0) return null;
    const isCollapsed = collapsed[label];
    return (
      <div className="mb-2 flex flex-col gap-0.5">
        <button
          type="button"
          className="flex items-center gap-0.5 rounded-md bg-transparent border-none cursor-pointer text-[11px] font-semibold px-2 py-1 uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
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
          items.map((conv, index) => (
            <button
              type="button"
              key={conv.id}
              className={cn(
                'group flex items-center w-full px-2 py-1.5 rounded-md bg-transparent border-none cursor-pointer text-left text-xs transition-all hover:bg-muted relative animate-in fade-in slide-in-from-top-1 duration-200',
                selectedId === conv.id && 'bg-muted font-semibold',
              )}
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => handleClick(conv)}
            >
              <span className="overflow-hidden text-ellipsis whitespace-nowrap pr-5 flex-1">
                {conv.title ?? t('New conversation')}
              </span>
              <DelayedTooltip>
                <TooltipTrigger asChild>
                  <span
                    role="button"
                    tabIndex={0}
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    onClick={(e) => handleDelete(e, conv.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        deleteConv(conv.id);
                        if (selectedId === conv.id) {
                          onNewChat?.();
                        }
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
          ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full shrink-0" style={{ width: '220px' }}>
      <div className="px-2 pt-3 pb-2">
        <button
          type="button"
          className="flex items-center justify-between gap-1.5 w-full px-2 py-1.5 rounded-md border border-border bg-transparent cursor-pointer text-xs text-foreground transition-colors hover:bg-accent"
          onClick={() => {
            onNewChat?.();
          }}
        >
          <span className="flex items-center gap-1.5">
            <Plus size={14} />
            {t('New chat')}
          </span>
          <span className="text-[11px] opacity-50">⇧⌘O</span>
        </button>
      </div>
      <div className="flex-1 relative min-h-0">
        {showTopFade && (
          <div className="absolute top-0 left-0 right-0 h-5 pointer-events-none z-[1] bg-gradient-to-b from-background to-transparent" />
        )}
        <div
          ref={listRef}
          onScroll={checkFades}
          className="h-full overflow-y-auto px-2 pb-3 scrollbar-thin"
        >
          {isLoadingConversations ? (
            <div className="space-y-2 px-2 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <>
              {renderGroup(t('Today'), today)}
              {renderGroup(t('Yesterday'), yesterdayList)}
              {renderGroup(t('Older'), olderList)}
            </>
          )}
        </div>
        {showBottomFade && (
          <div className="absolute bottom-0 left-0 right-0 h-[70px] pointer-events-none z-[1] bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
    </div>
  );
}
