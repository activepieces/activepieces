import { tryCatch } from '@activepieces/core-utils';
import { AgentConversation } from '@activepieces/shared';
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ArrowLeft,
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
import { memo, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { SettingsHubDialog } from '@/app/components/settings-hub/settings-hub-dialog';
import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { ChatAppLinks } from '@/app/routes/chat-with-ai/components/chat-app-links';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { chatApi } from '@/features/chat/lib/chat-api';
import { chatDom } from '@/features/chat/lib/chat-dom';
import { chatPendingDeletes } from '@/features/chat/lib/chat-pending-deletes';
import { chatQueryKeys } from '@/features/chat/lib/chat-query-keys';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { MOTION } from '@/features/workspace/lib/chat-layout';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { windowSizeHooks } from '@/features/workspace/lib/window-size-hooks';
import { cn } from '@/lib/utils';

import { ChatHistoryList } from './chat-history-list';
import { historyMotion } from './chat-history-motion';
import {
  useActiveConversationId,
  useChatSheet,
  useChatWidth,
} from './chat-window';

export function ChatChrome() {
  const layout = useChatWidth();
  const conversationId = useActiveConversationId();
  const newChatToken = useChatPanel((s) => s.newChatToken);
  const pendingPrompt = useChatPanel((s) => s.pendingPrompt);
  const queryClient = useQueryClient();
  const [typingId, setTypingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const renameCancelled = useRef(false);
  const titleInput = useRef<HTMLInputElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyByKey, setHistoryByKey] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const reduced = useReducedMotion();
  const full = layout === 'full';
  const sheet = layout === 'sheet';
  const chatShown = layout !== 'closed';

  if (!chatShown && historyOpen) {
    setHistoryOpen(false);
  }

  useEffect(() => {
    if (!chatShown) return;
    const onKey = (event: KeyboardEvent) => {
      if (chatDom.shortcutOf(event) === 'history') {
        event.preventDefault();
        setHistoryByKey(true);
        setHistoryOpen((open) => !open);
        return;
      }
      if (
        event.key === 'Escape' &&
        historyOpen &&
        chatDom.inChat(document.activeElement) &&
        chatDom.escapeFree(event)
      ) {
        chatDom.claimEscape(event);
        setHistoryOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [chatShown, historyOpen]);
  const phone = windowSizeHooks.useIsPhone();
  const chatSheet = useChatSheet();
  const renaming = renamingId !== null && renamingId === conversationId;
  const setRenaming = (on: boolean) =>
    setRenamingId(on ? conversationId : null);
  const { title, loading: titleLoading } = useConversationTitle({
    conversationId,
  });

  const invalidateList = () =>
    queryClient
      .invalidateQueries({ queryKey: chatQueryKeys.allConversationLists() })
      .catch(() => undefined);

  const openConversation = (id: string) => {
    setHistoryOpen(false);
    if (full) {
      chatPanelUtils.showOnFullPage(id);
    } else {
      useChatPanel.getState().showConversation(id);
    }
  };

  const startFresh = () => {
    setHistoryOpen(false);
    chatPanelUtils.startNewChat();
  };

  const finishRename = async (next: string) => {
    setRenaming(false);
    const trimmed = next.trim();
    if (!conversationId || !trimmed || trimmed === title) return;
    const key = chatQueryKeys.conversation(conversationId);
    const previous = queryClient.getQueryData<AgentConversation | null>(key);
    setTypingId(null);
    setCachedTitle({ queryClient, conversationId, title: trimmed });
    const { error } = await tryCatch(() =>
      chatApi.updateConversation(conversationId, { title: trimmed }),
    );
    if (error) {
      queryClient.setQueryData(key, previous);
      toast.error(t('Failed to rename conversation'));
      return;
    }
    invalidateList();
  };

  const deleteChat = () => {
    if (!conversationId) return;
    const id = conversationId;
    const bringBack = () => {
      if (useChatPanel.getState().conversationId) return;
      openConversation(id);
    };
    chatPendingDeletes.removeWithUndo({
      queryClient,
      id,
      onUndo: bringBack,
      onFailed: bringBack,
    });
    startFresh();
  };

  return (
    <>
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
            {historyOpen ? (
              <motion.div
                key="history"
                {...titleFade()}
                className="flex min-w-0 items-center gap-1 [grid-area:1/1]"
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('Back to chat')}
                  onClick={() => setHistoryOpen(false)}
                  className="text-gray-11 hover:text-gray-12"
                >
                  <ArrowLeft />
                </Button>
                <h2 className="truncate text-sm font-semibold text-gray-12">
                  {t('History')}
                </h2>
              </motion.div>
            ) : renaming ? (
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
                {...titleFade()}
                className="[grid-area:1/1]"
              >
                <Skeleton className="h-4 w-32" />
              </motion.div>
            ) : (
              <motion.h2
                key="chat"
                {...titleFade()}
                title={title ?? undefined}
                className="truncate text-sm font-semibold text-gray-12 [grid-area:1/1]"
              >
                {title && typingId === conversationId ? (
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
            onClick={() => {
              setHistoryByKey(false);
              setHistoryOpen(!historyOpen);
            }}
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
      <div className="relative min-h-0 flex-1">
        <AnimatePresence initial={false}>
          {historyOpen && (
            <motion.div
              key="history"
              {...historyMotion.enter({ reduced, instant: historyByKey })}
              className="absolute inset-0 z-10 bg-gray-1"
            >
              <ChatHistoryList
                wide={full}
                selectedId={conversationId}
                onSelect={openConversation}
                onCurrentDeleted={chatPanelUtils.startNewChat}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div inert={historyOpen} className="h-full">
          <ChatBody
            full={full}
            conversationId={conversationId}
            newChatToken={newChatToken}
            prompt={pendingPrompt}
            onTitleTyped={setTypingId}
          />
        </div>
      </div>
      <SettingsHubDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

const ChatBody = memo(function ChatBody({
  full,
  conversationId,
  newChatToken,
  prompt,
  onTitleTyped,
}: {
  full: boolean;
  conversationId: string | null;
  newChatToken: number;
  prompt?: string;
  onTitleTyped: (conversationId: string) => void;
}) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient
      .invalidateQueries({ queryKey: chatQueryKeys.allConversationLists() })
      .catch(() => undefined);
  const showOnPage = (id: string | null) => {
    if (full) chatPanelUtils.showOnFullPage(id);
  };
  return (
    <ChatAppLinks>
      <AIChatBox
        key={newChatToken}
        incognito={false}
        compact={!full}
        autoFocusComposer={newChatToken > 0}
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
          if (id) {
            setCachedTitle({ queryClient, conversationId: id, title: next });
            onTitleTyped(id);
          }
          invalidate();
        }}
      />
    </ChatAppLinks>
  );
});

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

function setCachedTitle({
  queryClient,
  conversationId,
  title,
}: {
  queryClient: QueryClient;
  conversationId: string;
  title: string;
}): void {
  const key = chatQueryKeys.conversation(conversationId);
  const cached = queryClient.getQueryData<AgentConversation | null>(key);
  if (!cached) {
    queryClient.invalidateQueries({ queryKey: key }).catch(() => undefined);
    return;
  }
  queryClient.setQueryData<AgentConversation | null>(key, {
    ...cached,
    title,
  });
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
              ? t('Opens pages the AI changes.')
              : t('Stays on your page.')}
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
    <Tooltip delayDuration={HEADER_TOOLTIP_DELAY_MS}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="text-gray-11 transition-colors duration-(--dur-micro) ease-[ease] hover:text-gray-12 active:bg-gray-5 aria-pressed:bg-gray-4 aria-pressed:text-gray-12 data-[state=open]:bg-gray-4 data-[state=open]:text-gray-12"
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
    </Tooltip>
  );
}

const HEADER_TOOLTIP_DELAY_MS = 500;
const TOGGLE_SHORTCUT = modShortcut({ key: 'J' });
const HISTORY_SHORTCUT = modShortcut({ key: 'H', shift: true });
const NEW_CHAT_SHORTCUT = modShortcut({ key: 'O', shift: true });

function titleFade() {
  return {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: MOTION.base, ease: MOTION.easeOut },
    },
    exit: { opacity: 0, transition: { duration: 0 } },
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
      Math.min(TYPE_STEP_MS, TYPE_TOTAL_MS / Math.max(1, text.length)),
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

const TYPE_STEP_MS = 24;
const TYPE_TOTAL_MS = 300;
