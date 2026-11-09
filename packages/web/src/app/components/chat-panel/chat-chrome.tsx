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
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { memo, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { SettingsHubDialog } from '@/app/components/settings-hub/settings-hub-dialog';
import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { ChatAppLinks } from '@/app/routes/chat-with-ai/components/chat-app-links';
import { ConversationList } from '@/app/routes/chat-with-ai/conversation-list';
import { KbdHint, modShortcut } from '@/components/custom/kbd-hint';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { chatApi } from '@/features/chat/lib/chat-api';
import { chatPendingDeletes } from '@/features/chat/lib/chat-pending-deletes';
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
import { cn } from '@/lib/utils';

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
  const queryClient = useQueryClient();
  const [liveTitle, setLiveTitle] = useState<LiveTitle | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const renameCancelled = useRef(false);
  const titleInput = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const reduced = useReducedMotion();
  const full = layout === 'full';
  const sheet = layout === 'sheet';
  const chatShown = layout !== 'closed';

  useEffect(() => {
    if (!chatShown) return;
    const onKey = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        !event.altKey &&
        event.key.toLowerCase() === 'h'
      ) {
        event.preventDefault();
        setHistoryOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chatShown]);
  const phone = windowSizeHooks.useWidth() < chatLayoutUtils.MOBILE_BREAKPOINT;
  const chatSheet = useChatSheet();
  const renaming = renamingId !== null && renamingId === conversationId;
  const setRenaming = (on: boolean) =>
    setRenamingId(on ? conversationId : null);
  const currentLiveTitle = liveTitle?.id === conversationId ? liveTitle : null;
  const { title, loading: titleLoading } = useConversationTitle({
    conversationId,
    liveTitle: currentLiveTitle?.title ?? null,
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
    const previous = liveTitle;
    setLiveTitle({ id: conversationId, title: trimmed, fresh: false });
    const { error } = await tryCatch(() =>
      chatApi.updateConversation(conversationId, { title: trimmed }),
    );
    if (error) {
      setLiveTitle(previous);
      toast.error(t('Failed to rename conversation'));
      return;
    }
    invalidateList();
  };

  const deleteChat = () => {
    if (!conversationId) return;
    const id = conversationId;
    chatPendingDeletes.removeWithUndo({
      id,
      onUndo: () => {
        if (useChatPanel.getState().conversationId) return;
        openConversation(id);
      },
      onSettled: () => {
        queryClient.removeQueries({ queryKey: ['chat-conversation', id] });
        invalidateList();
      },
    });
    startFresh();
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
        <div className="grid min-w-0 flex-1 items-center">
          <AnimatePresence initial={false}>
            {renaming ? (
              <Input
                key="rename"
                ref={titleInput}
                aria-label={t('Chat title')}
                defaultValue={title ?? ''}
                onBlur={(event) => {
                  if (renameCancelled.current) {
                    renameCancelled.current = false;
                    setRenaming(false);
                    return;
                  }
                  finishRename(event.currentTarget.value).catch(
                    () => undefined,
                  );
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
                className="-ml-1.5 h-8 min-w-0 px-1.5 text-sm font-semibold [grid-area:1/1]"
              />
            ) : titleLoading ? (
              <motion.div
                key="loading"
                {...titleFade(reduced)}
                className="[grid-area:1/1]"
              >
                <Skeleton className="h-4 w-32" />
              </motion.div>
            ) : (
              <motion.h2
                key="chat"
                {...titleFade(reduced)}
                title={title ?? undefined}
                className="truncate text-sm font-semibold text-gray-12 [grid-area:1/1]"
              >
                {title && currentLiveTitle?.fresh ? (
                  <TypedText text={title} />
                ) : (
                  title ?? t('New chat')
                )}
              </motion.h2>
            )}
          </AnimatePresence>
        </div>
        <div className="-mr-1 flex shrink-0 items-center gap-0.5">
          <HeaderButton
            label={historyOpen ? t('Hide history') : t('History')}
            shortcut={HISTORY_SHORTCUT}
            aria-pressed={historyOpen}
            onClick={() => setHistoryOpen(!historyOpen)}
          >
            <History />
          </HeaderButton>
          <HeaderButton
            label={t('New chat')}
            shortcut={NEW_CHAT_SHORTCUT}
            onClick={startFresh}
          >
            <Plus />
          </HeaderButton>
          {!phone && <LayoutMenu />}
          <MoreMenu
            hasConversation={conversationId !== null}
            onRename={() => {
              setHistoryOpen(false);
              setRenaming(true);
            }}
            renameInput={titleInput}
            onDelete={deleteChat}
            onSettings={() => setSettingsOpen(true)}
          />
          {!full && (
            <HeaderButton
              label={t('Close')}
              shortcut={TOGGLE_SHORTCUT}
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
        {historyOpen && (
          <ConversationList
            className="absolute inset-0 z-10 w-full bg-gray-1 animate-in fade-in duration-150 ease-move motion-reduce:animate-none"
            selectedId={conversationId}
            onSelect={openConversation}
            onNewChat={startFresh}
          />
        )}
        <div inert={historyOpen} className="h-full">
          <ChatBody
            full={full}
            conversationId={conversationId}
            newChatToken={newChatToken}
            prompt={pendingPrompt}
            onLiveTitle={setLiveTitle}
          />
        </div>
      </div>
      <SettingsHubDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </TooltipProvider>
  );
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
        key={newChatToken}
        incognito={false}
        compact={!full}
        conversationId={conversationId}
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
          if (id) onLiveTitle({ id, title: next, fresh: true });
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
}): { title: string | null; loading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['chat-conversation', conversationId],
    queryFn: () =>
      conversationId ? chatApi.getConversation(conversationId) : null,
    enabled: !!conversationId && !liveTitle,
    staleTime: Infinity,
  });
  const title = liveTitle ?? data?.title ?? null;
  return {
    title: title ? chatUtils.sanitizeTitle(title) : null,
    loading: isLoading,
  };
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
      <DropdownMenuContent
        align="end"
        className="w-44"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
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
            <PanelLeft className="size-4" />
            {t('On the left')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="right">
            <PanelRight className="size-4" />
            {t('On the right')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="full">
            <Maximize2 className="size-4" />
            {t('Full page')}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MoreMenu({
  hasConversation,
  onRename,
  renameInput,
  onDelete,
  onSettings,
}: {
  hasConversation: boolean;
  onRename: () => void;
  renameInput: React.RefObject<HTMLInputElement | null>;
  onDelete: () => void;
  onSettings: () => void;
}) {
  const renameChosen = useRef(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderButton label={t('More')}>
          <Ellipsis />
        </HeaderButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (!renameChosen.current) return;
          renameChosen.current = false;
          renameInput.current?.focus();
        }}
      >
        <FollowAlongItems />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!hasConversation}
          onSelect={() => {
            renameChosen.current = true;
            onRename();
          }}
        >
          <Pencil className="size-4" />
          {t('Rename')}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!hasConversation}
          onSelect={onDelete}
          className="text-danger-11 focus:text-danger-11"
        >
          <Trash2 className="size-4" />
          {t('Delete')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSettings}>
          <Settings className="size-4" />
          {t('Chat settings')}
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
        className="cursor-pointer items-start [&>span:first-child]:top-2"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span>{t('Follow along')}</span>
          <span className="text-xs text-gray-10">
            {autoFollow
              ? t('Opens what it edits.')
              : t("Doesn't open pages for you.")}
          </span>
        </span>
      </DropdownMenuCheckboxItem>
      {autoFollow && editing && (
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
  shortcut,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string; shortcut?: string }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="text-gray-11 transition-colors duration-150 hover:text-gray-12 active:bg-gray-5 aria-pressed:bg-gray-4 aria-pressed:text-gray-12 data-[state=open]:bg-gray-4 data-[state=open]:text-gray-12"
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={4}
        className="pointer-events-none flex items-center gap-2"
      >
        {label}
        {shortcut && <KbdHint>{shortcut}</KbdHint>}
      </TooltipContent>
    </TooltipPrimitive.Root>
  );
}

const TOGGLE_SHORTCUT = modShortcut({ key: 'J' });
const HISTORY_SHORTCUT = modShortcut({ key: 'H', shift: true });
const NEW_CHAT_SHORTCUT = modShortcut({ key: 'O', shift: true });

function titleFade(reduced: boolean | null) {
  return {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: reduced ? 0.1 : 0.22,
        ease: TITLE_EASE,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: reduced ? 0.08 : 0.16,
        ease: TITLE_EASE,
      },
    },
  };
}

function TypedText({ text }: { text: string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? text.length : 0);

  useEffect(() => {
    if (reduced) {
      setShown(text.length);
      return;
    }
    setShown(0);
    const timer = setInterval(
      () =>
        setShown((count) => {
          if (count >= text.length) clearInterval(timer);
          return Math.min(count + 1, text.length);
        }),
      TYPE_STEP_MS,
    );
    return () => clearInterval(timer);
  }, [text, reduced]);

  return (
    <>
      <span aria-hidden>{text.slice(0, shown)}</span>
      <span className="sr-only">{text}</span>
    </>
  );
}

const TITLE_EASE = [0.22, 1, 0.36, 1] as const;
const TYPE_STEP_MS = 24;

type LiveTitle = { id: string; title: string; fresh: boolean };
