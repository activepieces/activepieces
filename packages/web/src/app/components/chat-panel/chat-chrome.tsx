import { t } from 'i18next';
import {
  ArrowLeft,
  Ellipsis,
  History,
  Maximize2,
  Minimize2,
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
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { SettingsHubDialog } from '@/app/components/settings-hub/settings-hub-dialog';
import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { ChangedInThisChat } from '@/app/routes/chat-with-ai/components/changed-in-this-chat';
import { ChatDisabledState } from '@/app/routes/chat-with-ai/components/chat-empty-state';
import { KbdHint, modShortcut } from '@/components/custom/kbd-hint';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { chatDom } from '@/features/chat/lib/chat-dom';
import { chatDemoGate } from '@/features/chat/lib/demo/chat-demo-gate';
import {
  ChatWidth,
  chatLayoutUtils,
} from '@/features/workspace/lib/chat-layout';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { platformHooks } from '@/hooks/platform-hooks';
import { safeStorage } from '@/lib/safe-storage';
import { cn } from '@/lib/utils';

import { useShellHandle } from '../app-shell';

import {
  useChatHistoryActions,
  useConversationTitle,
} from './chat-history-data';
import { ChatHistoryList } from './chat-history-list';
import { historyMotion } from './chat-history-motion';
import { ChatRenameInput } from './chat-rename-input';
import { useChatToastPlacement, useChatWidth } from './chat-window';

export function ChatChrome({
  onSheetDrag,
}: {
  onSheetDrag: (event: React.PointerEvent<HTMLElement>) => void;
}) {
  const navigate = useNavigate();
  const layout = useChatWidth();
  const conversationId = useChatPanel((s) => s.conversationId);
  const newChatToken = useChatPanel((s) => s.newChatToken);
  const pendingPrompt = useChatPanel((s) => s.pendingPrompt);
  const lastPage = useChatPanel((s) => s.lastPage);
  const split = useChatPanel((s) => s.split) && layout === 'left';
  const splitName = useChatPanel((s) => s.splitName);
  const splitHint = useSplitHint(split);
  const chatEnabled =
    platformHooks.useCurrentPlatform().platform.plan.chatEnabled;
  const reduced = useReducedMotion();
  const [historyIn, setHistoryIn] = useState<ChatWidth | null>(null);
  const [liveTitle, setLiveTitle] = useState<LiveTitle | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pinned, setPinned] = useState(() =>
    safeStorage.readFlag({ area: 'local', key: PINNED_KEY }),
  );
  const toastPosition = useChatToastPlacement().position;
  const headerRef = useRef<HTMLDivElement>(null);
  const roomy = useRoomyContainer(headerRef);

  const full = layout === 'full';
  const sheet = layout === 'sheet';
  const columnMode = full && roomy;
  const historyColumn = columnMode && pinned;
  const historyOpen =
    !columnMode && layout !== 'closed' && historyIn === layout;
  const currentLiveTitle = liveTitle?.id === conversationId ? liveTitle : null;
  const title = useConversationTitle({
    conversationId,
    liveTitle: currentLiveTitle?.title ?? null,
  });
  const { invalidate, rename, remove } = useChatHistoryActions();

  useEffect(() => {
    setRenaming(false);
    setLiveTitle((prev) => (prev?.id === conversationId ? prev : null));
  }, [conversationId]);

  const focusChat = useCallback(
    () => requestAnimationFrame(() => chatDom.composer()?.focus()),
    [],
  );
  const backToChat = useCallback(() => {
    setHistoryIn(null);
    focusChat();
  }, [focusChat]);
  const startFresh = useCallback(
    (prompt?: string) => {
      useChatPanel.getState().newChat(prompt);
      backToChat();
    },
    [backToChat],
  );
  const openConversation = useCallback(
    (id: string) => {
      useChatPanel.getState().openConversation(id);
      backToChat();
    },
    [backToChat],
  );

  const toggleHistory = useCallback(() => {
    if (columnMode) {
      setPinned(!pinned);
      safeStorage.writeFlag({ area: 'local', key: PINNED_KEY, value: !pinned });
      return;
    }
    setHistoryIn((prev) => (prev === layout ? null : layout));
  }, [columnMode, pinned, layout]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    return chatDemoGate.onPlay((target) => {
      invalidate();
      if (target.kind === 'conversation') {
        openConversation(target.conversationId);
      } else {
        startFresh(target.prompt);
      }
    });
  }, [invalidate, openConversation, startFresh]);

  useEffect(() => {
    if (layout === 'closed' || !chatEnabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (
        !(event.metaKey || event.ctrlKey) ||
        !event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'o') {
        event.preventDefault();
        startFresh();
      } else if (key === 'h') {
        event.preventDefault();
        toggleHistory();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [layout, chatEnabled, startFresh, toggleHistory]);

  useEffect(() => {
    if (!historyOpen) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const panel = headerRef.current?.parentElement;
      if (
        event.key !== 'Escape' ||
        !(target instanceof Node && panel?.contains(target)) ||
        (target instanceof HTMLInputElement &&
          (target.value || target.getAttribute('role') !== 'combobox')) ||
        !chatDom.escapeFree(event)
      ) {
        return;
      }
      chatDom.claimEscape(event);
      backToChat();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [historyOpen, backToChat]);

  const shift = historyMotion.shift(reduced);
  const historyList = (
    <ChatHistoryList
      className="flex-1"
      currentId={conversationId}
      onSelect={openConversation}
      onNewChat={startFresh}
      toastPosition={toastPosition}
      autoFocus={!historyColumn}
    />
  );
  const openFullPage = () => chatPanelUtils.expand();
  const collapseToSide = lastPage
    ? () => {
        navigate(lastPage);
        const panel = useChatPanel.getState();
        if (window.innerWidth >= chatLayoutUtils.MOBILE_BREAKPOINT) {
          panel.dock('left');
        } else {
          panel.setOpen(true);
        }
      }
    : undefined;
  const finishRename = (next: string | null) => {
    setRenaming(false);
    const trimmed = next?.trim();
    if (!conversationId || !trimmed || trimmed === title) return;
    setLiveTitle({ id: conversationId, title: trimmed, fresh: false });
    rename({ id: conversationId, title: trimmed }).catch(() => undefined);
  };
  const deleteChat = () => {
    if (!conversationId) return;
    const id = conversationId;
    remove({
      id,
      position: toastPosition,
      onUndo: () => {
        if (useChatPanel.getState().conversationId) return;
        openConversation(id);
      },
    });
    startFresh();
  };

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={300}>
      <div
        ref={headerRef}
        data-chat-header
        onPointerDown={sheet ? onSheetDrag : undefined}
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
                {...titleFade(reduced)}
                className="-ml-2 flex min-w-0 items-center gap-1 [grid-area:1/1]"
              >
                <HeaderButton
                  label={t('Back to chat')}
                  shortcut="Esc"
                  onClick={backToChat}
                >
                  <ArrowLeft />
                </HeaderButton>
                <h2 className="truncate text-sm font-semibold text-gray-12">
                  {t('History')}
                </h2>
              </motion.div>
            ) : renaming ? (
              <ChatRenameInput
                key="rename"
                label={t('Chat title')}
                className="-ml-1.5 h-8 min-w-0 rounded-md border bg-gray-1 px-1.5 text-sm font-semibold text-gray-12 outline-none [grid-area:1/1] focus-visible:ring-2 focus-visible:ring-gray-8"
                initial={title ?? ''}
                onDone={finishRename}
              />
            ) : (
              <motion.h2
                key="chat"
                {...titleFade(reduced)}
                title={title ?? undefined}
                className="truncate text-sm font-semibold text-gray-12 [grid-area:1/1]"
              >
                {!chatEnabled ? (
                  t('Chat')
                ) : title && currentLiveTitle?.fresh ? (
                  <TypedText text={title} />
                ) : (
                  title ?? t('New chat')
                )}
              </motion.h2>
            )}
          </AnimatePresence>
        </div>
        <div className="-mr-1 flex shrink-0 items-center gap-0.5">
          {chatEnabled && (
            <>
              <HeaderButton
                label={
                  historyOpen || historyColumn
                    ? t('Hide history')
                    : t('History')
                }
                shortcut={HISTORY_SHORTCUT}
                pressed={historyOpen || historyColumn}
                onClick={toggleHistory}
              >
                <History />
              </HeaderButton>
              <HeaderButton
                label={t('New chat')}
                shortcut={NEW_CHAT_SHORTCUT}
                onClick={() => startFresh()}
              >
                <Plus />
              </HeaderButton>
            </>
          )}
          {split && (
            <HeaderButton label={t('Expand chat')} onClick={openFullPage}>
              <Maximize2 />
            </HeaderButton>
          )}
          {(chatEnabled || !full || collapseToSide) && (
            <MoreMenu
              chatEnabled={chatEnabled}
              conversationId={conversationId}
              layout={layout}
              split={split}
              onOpenFullPage={openFullPage}
              onCollapseToSide={collapseToSide}
              onRename={() => {
                setHistoryIn(null);
                setRenaming(true);
              }}
              onDelete={deleteChat}
              onSettings={() => setSettingsOpen(true)}
            />
          )}
          {!full && (
            <HeaderButton
              label={t('Close')}
              shortcut={TOGGLE_SHORTCUT}
              onClick={() => useChatPanel.getState().setOpen(false)}
            >
              <X />
            </HeaderButton>
          )}
        </div>
      </div>
      <AnimatePresence>
        {splitHint && (
          <motion.div
            key="split-hint"
            role="note"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="pointer-events-none absolute top-12 right-3 z-20 max-w-64 rounded-lg bg-gray-12 px-3 py-2 text-xs text-gray-1 shadow-lift"
          >
            {splitName
              ? t(
                  'The chat moved aside so you can see {name}. Expand brings it back.',
                  {
                    name: splitName,
                  },
                )
              : t(
                  'The chat moved aside so you can see the page. Expand brings it back.',
                )}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex min-h-0 flex-1">
        {historyColumn && (
          <aside
            aria-label={t('Chat history')}
            className="flex w-72 shrink-0 flex-col border-r bg-gray-1 pt-2 [--history-bg:var(--color-gray-1)]"
          >
            {historyList}
          </aside>
        )}
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <motion.div
            inert={historyOpen}
            aria-hidden={historyOpen || undefined}
            initial={false}
            animate={
              historyOpen
                ? { opacity: 0, x: -shift * 0.6 }
                : { opacity: 1, x: 0 }
            }
            transition={
              historyOpen
                ? historyMotion.viewOut(reduced)
                : historyMotion.viewIn(reduced)
            }
            className="absolute inset-0"
          >
            {chatEnabled ? (
              <ChatBody
                full={full}
                conversationId={conversationId}
                newChatToken={newChatToken}
                prompt={pendingPrompt}
                onLiveTitle={setLiveTitle}
              />
            ) : (
              <ChatDisabledState />
            )}
          </motion.div>
          <AnimatePresence initial={false}>
            {historyOpen && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: shift }}
                animate={{
                  opacity: 1,
                  x: 0,
                  transition: historyMotion.viewIn(reduced),
                }}
                exit={{
                  opacity: 0,
                  x: shift,
                  transition: historyMotion.viewOut(reduced),
                }}
                className="absolute inset-0 flex flex-col bg-gray-1 [--history-bg:var(--color-gray-1)]"
              >
                {historyList}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <SettingsHubDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
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

function useSplitHint(split: boolean): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (
      !split ||
      safeStorage.readFlag({ area: 'local', key: SPLIT_HINT_KEY })
    ) {
      return;
    }
    safeStorage.writeFlag({ area: 'local', key: SPLIT_HINT_KEY, value: true });
    const show = setTimeout(() => setVisible(true), SPLIT_HINT_DELAY_MS);
    const hide = setTimeout(() => setVisible(false), SPLIT_HINT_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
      setVisible(false);
    };
  }, [split]);
  return visible;
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
  const { invalidate } = useChatHistoryActions();
  return (
    <AIChatBox
      incognito={false}
      compact={!full}
      conversationId={conversationId}
      newChatToken={newChatToken}
      initialPrompt={prompt}
      onConversationCreated={(id) => {
        useChatPanel.getState().conversationCreated(id);
        invalidate();
      }}
      onConversationMissing={() =>
        useChatPanel.getState().conversationMissing()
      }
      onTitleUpdate={(next) => {
        const id = useChatPanel.getState().conversationId;
        if (id) onLiveTitle({ id, title: next, fresh: true });
        invalidate();
      }}
    />
  );
});

function titleFade(reduced: boolean | null) {
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: historyMotion.viewIn(reduced) },
    exit: { opacity: 0, transition: historyMotion.viewOut(reduced) },
  };
}

function HeaderButton({
  label,
  shortcut,
  pressed,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  label: string;
  shortcut?: string;
  pressed?: boolean;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-pressed={pressed}
          className={cn(
            'text-gray-11 transition-colors duration-150 hover:text-gray-12 active:bg-gray-5 data-[state=open]:bg-gray-4 data-[state=open]:text-gray-12',
            pressed && 'bg-gray-4 text-gray-12',
            className,
          )}
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

function MoreMenu({
  chatEnabled,
  conversationId,
  layout,
  split,
  onOpenFullPage,
  onCollapseToSide,
  onRename,
  onDelete,
  onSettings,
}: {
  chatEnabled: boolean;
  conversationId: string | null;
  layout: ChatWidth;
  split: boolean;
  onOpenFullPage: () => void;
  onCollapseToSide: (() => void) | undefined;
  onRename: () => void;
  onDelete: () => void;
  onSettings: () => void;
}) {
  const full = layout === 'full';
  const hasConversation = chatEnabled && conversationId !== null;
  const escaped = useRef(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderButton label={t('More')}>
          <Ellipsis />
        </HeaderButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72"
        onEscapeKeyDown={() => {
          escaped.current = true;
        }}
        onCloseAutoFocus={(event) => {
          if (!escaped.current) event.preventDefault();
          escaped.current = false;
        }}
      >
        {full
          ? onCollapseToSide && (
              <DropdownMenuItem onSelect={onCollapseToSide}>
                <Minimize2 className="size-4" />
                {t('Collapse to side')}
              </DropdownMenuItem>
            )
          : !split && (
              <DropdownMenuItem onSelect={onOpenFullPage}>
                <Maximize2 className="size-4" />
                {t('Open full page')}
              </DropdownMenuItem>
            )}
        {!full && layout !== 'sheet' && <MoveSideItem layout={layout} />}
        {chatEnabled && (
          <>
            <FollowAlongItem />
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!hasConversation} onSelect={onRename}>
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
            {hasConversation && (
              <>
                <DropdownMenuSeparator />
                <ChangedInThisChat conversationId={conversationId} />
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onSettings}>
              <Settings className="size-4" />
              {t('Chat settings')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MoveSideItem({ layout }: { layout: ChatWidth }) {
  const target = layout === 'right' ? 'left' : 'right';
  const Icon = target === 'left' ? PanelLeft : PanelRight;
  return (
    <DropdownMenuItem onSelect={() => useChatPanel.getState().dock(target)}>
      <Icon className="size-4" />
      {target === 'left' ? t('Move to left side') : t('Move to right side')}
    </DropdownMenuItem>
  );
}

function FollowAlongItem() {
  const autoFollow = useChatPanel((s) => s.autoFollow);
  return (
    <DropdownMenuCheckboxItem
      checked={autoFollow}
      onCheckedChange={(next) => useChatPanel.getState().setAutoFollow(next)}
      onSelect={(event) => event.preventDefault()}
      className="cursor-pointer items-start [&>span:first-child]:top-2"
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span>{t('Follow along')}</span>
        <span className="text-xs text-gray-10">
          {autoFollow ? t('Opens what it edits.') : t('Asks before opening.')}
        </span>
      </span>
    </DropdownMenuCheckboxItem>
  );
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

function useRoomyContainer(
  innerRef: React.RefObject<HTMLElement | null>,
): boolean {
  const [roomy, setRoomy] = useState(false);
  useEffect(() => {
    const container = innerRef.current?.parentElement;
    if (!container) return;
    const measure = () => setRoomy(container.clientWidth >= ROOMY_WIDTH);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [innerRef]);
  return roomy;
}

const TOGGLE_SHORTCUT = modShortcut({ key: 'J' });
const HISTORY_SHORTCUT = modShortcut({ key: 'H', shift: true });
const NEW_CHAT_SHORTCUT = modShortcut({ key: 'O', shift: true });
const PINNED_KEY = 'chat-sidebar-pinned';
const SPLIT_HINT_KEY = 'chat-split-hint-seen';
const SPLIT_HINT_DELAY_MS = 500;
const SPLIT_HINT_MS = 6500;
const ROOMY_WIDTH = 1024;
const TYPE_STEP_MS = 24;

type LiveTitle = { id: string; title: string; fresh: boolean };
