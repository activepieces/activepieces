import { tryCatch } from '@activepieces/core-utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Ellipsis,
  EyeOff,
  History,
  Maximize2,
  PanelLeft,
  PanelRight,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { memo, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { ChatAppLinks } from '@/app/routes/chat-with-ai/components/chat-app-links';
import { ChatDisabledState } from '@/app/routes/chat-with-ai/components/chat-empty-state';
import { ConversationList } from '@/app/routes/chat-with-ai/conversation-list';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { chatApi } from '@/features/chat/lib/chat-api';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { windowSizeHooks } from '@/features/workspace/lib/window-size-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { useShellHandle } from '../app-shell';

import {
  useActiveConversationId,
  useChatSheet,
  useChatWidth,
} from './chat-window';

export function ChatChrome() {
  const layout = useChatWidth();
  const navigate = useNavigate();
  const conversationId = useActiveConversationId();
  const newChatToken = useChatPanel((s) => s.newChatToken);
  const pendingPrompt = useChatPanel((s) => s.pendingPrompt);
  const chatEnabled =
    platformHooks.useCurrentPlatform().platform.plan.chatEnabled;
  const queryClient = useQueryClient();
  const [liveTitle, setLiveTitle] = useState<LiveTitle | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const renameCancelled = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const full = layout === 'full';
  const sheet = layout === 'sheet';
  const phone = windowSizeHooks.useWidth() < chatLayoutUtils.MOBILE_BREAKPOINT;
  const chatSheet = useChatSheet();
  const renaming = renamingId !== null && renamingId === conversationId;
  const setRenaming = (on: boolean) =>
    setRenamingId(on ? conversationId : null);
  const title = useConversationTitle({
    conversationId,
    liveTitle: liveTitle?.id === conversationId ? liveTitle.title : null,
  });

  const invalidateList = () =>
    queryClient
      .invalidateQueries({ queryKey: ['chat-conversations'] })
      .catch(() => undefined);

  const openConversation = (id: string) => {
    setHistoryOpen(false);
    if (full) {
      navigate(chatPanelUtils.routeFor(id), { replace: true });
    } else {
      useChatPanel.getState().showConversation(id);
    }
  };

  const startFresh = () => {
    setHistoryOpen(false);
    chatPanelUtils.startNewChat();
    bodyRef.current?.querySelector('textarea')?.focus();
  };

  const finishRename = async (next: string) => {
    setRenaming(false);
    const trimmed = next.trim();
    if (!conversationId || !trimmed || trimmed === title) return;
    setLiveTitle({ id: conversationId, title: trimmed });
    const { error } = await tryCatch(() =>
      chatApi.updateConversation(conversationId, { title: trimmed }),
    );
    if (error) {
      toast.error(t('Failed to rename conversation'));
      return;
    }
    invalidateList();
  };

  const deleteChat = async () => {
    if (!conversationId) return;
    const id = conversationId;
    startFresh();
    const { error } = await tryCatch(() => chatApi.deleteConversation(id));
    if (error) {
      toast.error(t('Failed to delete conversation'));
      return;
    }
    queryClient.removeQueries({ queryKey: ['chat-conversation', id] });
    invalidateList();
  };

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={300}>
      <div
        data-chat-header
        className={cn(
          'relative flex h-14 shrink-0 items-center gap-2 pr-3 pl-4',
          sheet && 'touch-none select-none',
        )}
      >
        {sheet && (
          <span
            aria-hidden
            className="absolute top-2 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-gray-6"
          />
        )}
        <div className="min-w-0 flex-1">
          {renaming ? (
            <Input
              autoFocus
              aria-label={t('Chat title')}
              defaultValue={title ?? ''}
              onBlur={(event) => {
                if (renameCancelled.current) {
                  renameCancelled.current = false;
                  setRenaming(false);
                  return;
                }
                finishRename(event.currentTarget.value).catch(() => undefined);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                  event.currentTarget.blur();
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  renameCancelled.current = true;
                  event.currentTarget.blur();
                }
              }}
              className="-ml-1.5 h-8 px-1.5 text-sm font-semibold"
            />
          ) : (
            <h2
              title={title ?? undefined}
              className="truncate text-sm font-semibold text-gray-12"
            >
              {chatEnabled ? title ?? t('New chat') : t('Chat')}
            </h2>
          )}
        </div>
        <div className="-mr-1 flex shrink-0 items-center gap-0.5">
          {chatEnabled && (
            <>
              <HeaderButton
                label={historyOpen ? t('Hide history') : t('History')}
                aria-pressed={historyOpen}
                onClick={() => setHistoryOpen(!historyOpen)}
              >
                <History />
              </HeaderButton>
              <HeaderButton label={t('New chat')} onClick={startFresh}>
                <Plus />
              </HeaderButton>
            </>
          )}
          {!phone && <LayoutMenu />}
          {chatEnabled && conversationId && (
            <MoreMenu
              onRename={() => setRenaming(true)}
              onDelete={() => deleteChat().catch(() => undefined)}
            />
          )}
          {!full && (
            <HeaderButton
              label={t('Close')}
              onClick={() =>
                sheet
                  ? chatSheet.hide()
                  : useChatPanel.getState().setOpen(false)
              }
            >
              <X />
            </HeaderButton>
          )}
        </div>
      </div>
      <div ref={bodyRef} className="relative min-h-0 flex-1">
        {chatEnabled && historyOpen && (
          <ConversationList
            className="absolute inset-0 z-10 w-full bg-gray-1 animate-in fade-in duration-150 ease-move motion-reduce:animate-none"
            selectedId={conversationId}
            onSelect={openConversation}
            onNewChat={startFresh}
          />
        )}
        {chatEnabled ? (
          <div inert={historyOpen} className="h-full">
            <ChatBody
              full={full}
              conversationId={conversationId}
              newChatToken={newChatToken}
              prompt={pendingPrompt}
              onLiveTitle={setLiveTitle}
            />
          </div>
        ) : (
          <ChatDisabledState />
        )}
      </div>
    </TooltipProvider>
  );
}

export function ChatLastPageTracker() {
  const { pathname, search } = useLocation();
  const onChatPage = useShellHandle().chat === 'full';
  useEffect(() => {
    if (!onChatPage) {
      useChatPanel.getState().setLastPage(`${pathname}${search}`);
    }
  }, [onChatPage, pathname, search]);
  return null;
}

const ChatBody = memo(function ChatBody({
  full,
  conversationId,
  newChatToken,
  prompt,
  onLiveTitle,
}: {
  full: boolean;
  conversationId: string | null;
  newChatToken: number;
  prompt?: string;
  onLiveTitle: (title: LiveTitle) => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const invalidate = () =>
    queryClient
      .invalidateQueries({ queryKey: ['chat-conversations'] })
      .catch(() => undefined);
  const showOnPage = (id: string | null) => {
    if (full) navigate(chatPanelUtils.routeFor(id), { replace: true });
  };
  return (
    <ChatAppLinks>
      <AIChatBox
        incognito={false}
        compact={!full}
        conversationId={conversationId}
        newChatToken={newChatToken}
        initialPrompt={prompt}
        onConversationCreated={(id) => {
          useChatPanel.getState().conversationCreated(id);
          showOnPage(id);
          invalidate();
        }}
        onConversationMissing={() => {
          useChatPanel.getState().conversationMissing();
          showOnPage(null);
        }}
        onTitleUpdate={(next) => {
          const id = useChatPanel.getState().conversationId;
          if (id) onLiveTitle({ id, title: next });
          invalidate();
        }}
      />
    </ChatAppLinks>
  );
});

function useConversationTitle({
  conversationId,
  liveTitle,
}: {
  conversationId: string | null;
  liveTitle: string | null;
}): string | null {
  const { data } = useQuery({
    queryKey: ['chat-conversation', conversationId],
    queryFn: () =>
      conversationId ? chatApi.getConversation(conversationId) : null,
    enabled: !!conversationId && !liveTitle,
    staleTime: Infinity,
  });
  const title = liveTitle ?? data?.title ?? null;
  return title ? chatUtils.sanitizeTitle(title) : null;
}

function LayoutMenu() {
  const layout = useChatWidth();
  const mode = useChatPanel((s) => s.mode);
  const current = layout === 'full' ? 'full' : mode;
  const Icon =
    current === 'full'
      ? Maximize2
      : current === 'left'
      ? PanelLeft
      : PanelRight;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderButton label={t('Chat layout')}>
          <Icon />
        </HeaderButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(value) => {
            if (value === current) return;
            if (value === 'full') {
              chatPanelUtils.expand();
            } else if (value === 'left' || value === 'right') {
              chatPanelUtils.collapse(value);
            }
          }}
        >
          <DropdownMenuRadioItem value="left">
            {t('On the left')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="right">
            {t('On the right')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="full">
            {t('Full page')}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MoreMenu({
  onRename,
  onDelete,
}: {
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderButton label={t('More')}>
          <Ellipsis />
        </HeaderButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <FollowAlongItems />
        <DropdownMenuSeparator />
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
  );
}

function FollowAlongItems() {
  const autoFollow = useChatPanel((s) => s.autoFollow);
  const editing = useFollowAlong((s) => s.phase === 'editing' && s.following);
  return (
    <>
      <DropdownMenuCheckboxItem
        checked={autoFollow}
        onCheckedChange={(next) => useChatPanel.getState().setAutoFollow(next)}
        onSelect={(event) => event.preventDefault()}
        className="items-start [&>span:first-child]:top-2"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span>{t('Follow along')}</span>
          <span className="text-xs text-gray-10">
            {autoFollow
              ? t('Opens what the AI edits.')
              : t("Doesn't open pages for you.")}
          </span>
        </span>
      </DropdownMenuCheckboxItem>
      {editing && (
        <DropdownMenuItem onSelect={followAlong.stopFollowing}>
          <EyeOff className="size-4" />
          {t('Stop following')}
        </DropdownMenuItem>
      )}
    </>
  );
}

function HeaderButton({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="text-gray-11 hover:text-gray-12 aria-pressed:bg-gray-4 aria-pressed:text-gray-12 data-[state=open]:bg-gray-4 data-[state=open]:text-gray-12"
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4}>
        {label}
      </TooltipContent>
    </TooltipPrimitive.Root>
  );
}

type LiveTitle = { id: string; title: string };
