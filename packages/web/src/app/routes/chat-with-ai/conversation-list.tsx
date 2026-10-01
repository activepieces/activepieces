import { AgentConversation } from '@activepieces/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

  const { data: conversationsPage, isLoading: isLoadingConversations } =
    useQuery({
      queryKey: ['chat-conversations', agentId ?? 'chat'],
      queryFn: () =>
        chatApi.listConversations({
          limit: 100,
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

  const checkFades = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setShowTopFade(el.scrollTop > 5);
    setShowBottomFade(el.scrollTop + el.clientHeight < el.scrollHeight - 5);
  }, []);

  useEffect(() => {
    checkFades();
  }, [collapsed, conversations, checkFades]);

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
      <div className="flex flex-col gap-px pb-2">
        <button
          type="button"
          className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-medium text-gray-11 transition-colors hover:text-gray-12"
          onClick={() => toggleGroup(label)}
        >
          {label}
          <ChevronDown
            className={cn(
              'size-3.5 shrink-0 transition-transform duration-150',
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
                  'group relative flex h-8 w-full items-center rounded-lg px-2 text-left text-sm text-gray-12 transition-colors hover:bg-gray-3',
                  mobile && 'h-10 px-3',
                  selectedId === conv.id && 'bg-gray-4 font-medium',
                )}
                onClick={() => handleClick(conv)}
              >
                <span className="min-w-0 flex-1 truncate pr-5">
                  {conv.title
                    ? chatUtils.sanitizeTitle(conv.title)
                    : t('New conversation')}
                </span>
                {indicator && (
                  <span className="absolute top-1/2 right-2 -translate-y-1/2 transition-opacity group-hover:opacity-0">
                    <ConversationStatusDot state={indicator} />
                  </span>
                )}
                <DelayedTooltip>
                  <TooltipTrigger asChild>
                    <span
                      role="button"
                      tabIndex={0}
                      className={cn(
                        'absolute top-1/2 right-1 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-gray-11 opacity-0 transition-all group-hover:opacity-100 hover:bg-danger-3 hover:text-danger-11',
                        mobile && 'size-8 opacity-100',
                      )}
                      onClick={(e) => handleDelete(e, conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          deleteConv(conv.id);
                        }
                      }}
                    >
                      <Trash2 className="size-3.5" />
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
    <div className={cn('flex h-full w-60 shrink-0 flex-col', className)}>
      <div className="flex flex-col gap-2 p-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={cn(
              'flex h-8 grow items-center justify-between gap-2 rounded-lg px-2 text-sm text-gray-12 transition-colors hover:bg-gray-3',
              mobile && 'h-10 px-3',
            )}
            onClick={() => {
              onNewChat?.();
            }}
          >
            <span className="flex items-center gap-2">
              <Plus className="size-4" />
              {t('New chat')}
            </span>
            {!mobile && <span className="text-xs text-gray-11">⇧⌘O</span>}
          </button>
          {onCollapse !== undefined && (
            <ConversationsToggle open onClick={onCollapse} />
          )}
        </div>
        {allConversations.length > 5 && (
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-gray-11" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search...')}
              className="pl-8"
            />
          </div>
        )}
      </div>
      <div className="flex-1 relative min-h-0">
        {showTopFade && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-1 h-5 bg-gradient-to-b from-gray-1 to-transparent" />
        )}
        <div
          ref={listRef}
          onScroll={checkFades}
          className="h-full overflow-y-auto px-2 pb-2"
        >
          {isLoadingConversations ? (
            <div className="flex flex-col gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
              <MessageSquare className="size-5 text-gray-9" />
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
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-1 h-16 bg-gradient-to-t from-gray-1 to-transparent" />
        )}
      </div>
      {agentId === undefined && (
        <div className="shrink-0 border-t p-2">
          <button
            type="button"
            className={cn(
              'flex h-8 w-full items-center gap-2 rounded-lg px-2 text-sm text-gray-12 transition-colors hover:bg-gray-3',
              mobile && 'h-10 px-3',
            )}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="size-4" />
            {t('Settings')}
          </button>
        </div>
      )}
      {mobile && (
        <div className="shrink-0 border-t px-4 py-3">
          <p className="flex items-start gap-1.5 text-xs text-gray-11">
            <ArrowUpRight className="mt-0.5 size-3.5 shrink-0" />
            {t('Open on desktop for the full Activepieces experience.')}
          </p>
        </div>
      )}
      <SettingsHubDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
