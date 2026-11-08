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
  PictureInPicture2,
  Plus,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Popover as PopoverPrimitive,
  Tooltip as TooltipPrimitive,
} from 'radix-ui';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ToastT } from 'sonner';

import { SettingsHubDialog } from '@/app/components/settings-hub/settings-hub-dialog';
import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { ChatDisabledState } from '@/app/routes/chat-with-ai/components/chat-empty-state';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { chatDemo } from '@/features/chat/lib/demo/chat-demo';
import { playDemoScenario } from '@/features/chat/lib/demo/play-scenario';
import {
  ChatWidth,
  DOCK_BREAKPOINT,
} from '@/features/workspace/lib/chat-layout';
import {
  ChatPanelMode,
  chatTransitions,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { useShellHandle } from '../app-shell';

import {
  useChatHistoryActions,
  useConversationTitle,
} from './chat-history-data';
import { ChatHistoryList } from './chat-history-list';
import { historyMotion } from './chat-history-motion';
import { ChatHistoryPopover } from './chat-history-popover';
import {
  defaultFloat,
  FLOAT_DEFAULT,
  fitToWindow,
  useChatWidth,
  useWindowAtLeast,
} from './chat-window';

let autoplayed = false;
if (chatDemo.autoplayScenarioId) {
  const where = new URLSearchParams(window.location.search).get('chatDock');
  setTimeout(() => {
    const panel = useChatPanel.getState();
    if (where === 'float') {
      panel.floatAt(panel.float ?? { x: window.innerWidth - 440, y: 96 });
    } else {
      panel.dock(where === 'left' ? 'left' : 'right');
    }
  }, 0);
}

export function ChatChrome({
  onDragStart,
}: {
  onDragStart: (event: React.PointerEvent<HTMLElement>) => void;
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
  const [pinned, setPinned] = useState(readPinned);
  const headerRef = useRef<HTMLDivElement>(null);
  const historyButtonRef = useRef<HTMLButtonElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const roomy = useRoomyContainer(headerRef);

  const full = layout === 'full';
  const sheet = layout === 'sheet';
  const dropdown = layout === 'float';
  const columnMode = full && roomy;
  const historyColumn = columnMode && pinned;
  const historyOpen =
    !columnMode && layout !== 'closed' && historyIn === layout;
  const historyView = historyOpen && !dropdown;
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

  useEffect(
    () =>
      useChatPanel.subscribe((state, prev) => {
        if (state.gesture === 'dragging' && prev.gesture !== 'dragging') {
          setHistoryIn(null);
        }
      }),
    [],
  );

  const focusChat = useCallback(
    () =>
      requestAnimationFrame(() =>
        chatRef.current?.querySelector('textarea')?.focus(),
      ),
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
      savePinned(!pinned);
      return;
    }
    setHistoryIn((prev) => (prev === layout ? null : layout));
  }, [columnMode, pinned, layout]);

  useEffect(
    () =>
      chatDemo.onPlay((target) => {
        invalidate();
        if (target.kind === 'conversation') {
          openConversation(target.conversationId);
        } else {
          startFresh(target.prompt);
        }
      }),
    [invalidate, openConversation, startFresh],
  );
  useEffect(() => {
    const scenarioId = chatDemo.autoplayScenarioId;
    if (!scenarioId || autoplayed) return;
    autoplayed = true;
    playDemoScenario(scenarioId);
  }, []);

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
    if (!historyView) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const panel = headerRef.current?.parentElement;
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        !(target instanceof Node && panel?.contains(target)) ||
        (target instanceof HTMLInputElement &&
          (target.value || target.getAttribute('role') !== 'combobox')) ||
        document.querySelector('[role="menu"], [role="alertdialog"]')
      ) {
        return;
      }
      event.preventDefault();
      backToChat();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [historyView, backToChat]);

  const shift = historyMotion.shift(reduced);
  const historyList = (
    <ChatHistoryList
      className="flex-1"
      currentId={conversationId}
      onSelect={openConversation}
      onNewChat={startFresh}
      toastPosition={TOAST_POSITION[layout]}
      autoFocus={!historyColumn}
    />
  );
  const openFullPage = () => {
    const header = headerRef.current;
    const fromHeader = header?.contains(document.activeElement) ?? false;
    chatTransitions.expand();
    if (!fromHeader) return;
    requestAnimationFrame(() => {
      if (header?.contains(document.activeElement)) return;
      getComposer()?.focus({ preventScroll: true });
    });
  };
  const collapseToSide = lastPage
    ? () => {
        navigate(lastPage);
        const panel = useChatPanel.getState();
        if (window.innerWidth >= DOCK_BREAKPOINT) {
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
    rename(conversationId, trimmed).catch(() => undefined);
  };
  const deleteChat = () => {
    if (!conversationId) return;
    const id = conversationId;
    remove(id, {
      position: TOAST_POSITION[layout],
      onUndo: () => {
        if (useChatPanel.getState().conversationId) return;
        openConversation(id);
      },
    });
    startFresh();
  };

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={300}>
      <PopoverPrimitive.Root
        open={historyOpen && dropdown}
        onOpenChange={(next) => !next && setHistoryIn(null)}
      >
        <PopoverPrimitive.Anchor asChild>
          <div
            ref={headerRef}
            data-chat-header
            onPointerDown={full ? undefined : onDragStart}
            className={cn(
              'group/header relative flex h-14 shrink-0 items-center gap-2 pr-3 pl-4',
              !full && 'touch-none select-none',
              full || sheet ? 'cursor-default' : 'cursor-grab',
            )}
          >
            {!full && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-1/2 -translate-x-1/2 rounded-full transition-colors duration-150',
                  sheet
                    ? 'top-2 h-1 w-9 bg-gray-6'
                    : 'top-1.5 h-1 w-8 bg-gray-5 group-hover/header:bg-gray-7',
                )}
              />
            )}
            <div className="grid min-w-0 flex-1 items-center">
              <AnimatePresence initial={false}>
                {historyView ? (
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
                  <RenameTitle
                    key="rename"
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
                    ref={historyButtonRef}
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
              {full ? (
                collapseToSide && (
                  <FullLayoutMenu onCollapseToSide={collapseToSide} />
                )
              ) : sheet ? (
                <HeaderButton
                  label={t('Open full page')}
                  onClick={openFullPage}
                >
                  <Maximize2 />
                </HeaderButton>
              ) : (
                <>
                  {split && (
                    <HeaderButton
                      label={t('Expand chat')}
                      onClick={openFullPage}
                    >
                      <Maximize2 />
                    </HeaderButton>
                  )}
                  <LayoutMenu layout={layout} onOpenFullPage={openFullPage} />
                </>
              )}
              {chatEnabled && (
                <MoreMenu
                  hasConversation={!!conversationId}
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
        </PopoverPrimitive.Anchor>
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
        <ChatHistoryPopover
          open={historyOpen && dropdown}
          headerRef={headerRef}
          triggerRef={historyButtonRef}
          onEscape={focusChat}
        >
          {historyList}
        </ChatHistoryPopover>
      </PopoverPrimitive.Root>
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
            ref={chatRef}
            inert={historyView}
            aria-hidden={historyView || undefined}
            initial={false}
            animate={
              historyView
                ? { opacity: 0, x: -shift * 0.6 }
                : { opacity: 1, x: 0 }
            }
            transition={
              historyView
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
            {historyView && (
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

function getComposer(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[data-chat-root] textarea, [data-chat-root] [contenteditable="true"]',
  );
}

function useSplitHint(split: boolean): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!split || readFlag(SPLIT_HINT_KEY)) return;
    writeFlag(SPLIT_HINT_KEY);
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

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function writeFlag(key: string) {
  try {
    localStorage.setItem(key, 'true');
  } catch {
    return;
  }
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
        {shortcut && (
          <kbd className="font-sans text-xs text-gray-9">{shortcut}</kbd>
        )}
      </TooltipContent>
    </TooltipPrimitive.Root>
  );
}

const IS_MAC =
  typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent);
const TOGGLE_SHORTCUT = IS_MAC ? '⌘J' : 'Ctrl J';
const HISTORY_SHORTCUT = IS_MAC ? '⇧⌘H' : 'Ctrl Shift H';
const NEW_CHAT_SHORTCUT = IS_MAC ? '⇧⌘O' : 'Ctrl Shift O';
const PINNED_KEY = 'chat-sidebar-pinned';
const SPLIT_HINT_KEY = 'chat-split-hint-seen';
const SPLIT_HINT_DELAY_MS = 500;
const SPLIT_HINT_MS = 6500;
const ROOMY_WIDTH = 1024;
const TYPE_STEP_MS = 24;

const LAYOUTS: {
  mode: ChatPanelMode;
  label: string;
  icon: typeof PanelLeft;
}[] = [
  { mode: 'left', label: 'Dock left', icon: PanelLeft },
  { mode: 'right', label: 'Dock right', icon: PanelRight },
  { mode: 'float', label: 'Floating', icon: PictureInPicture2 },
];

function LayoutMenu({
  layout,
  onOpenFullPage,
}: {
  layout: ChatWidth;
  onOpenFullPage: () => void;
}) {
  const canDock = useWindowAtLeast(DOCK_BREAKPOINT);
  const CurrentIcon =
    LAYOUTS.find((option) => option.mode === layout)?.icon ?? PanelLeft;

  const moveTo = (next: string) => {
    const panel = useChatPanel.getState();
    if (next === 'left' || next === 'right') {
      panel.dock(next);
      return;
    }
    const size = fitToWindow(panel.floatSize ?? FLOAT_DEFAULT);
    panel.floatAt(panel.float ?? defaultFloat(size));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderButton label={t('Panel layout')}>
          <CurrentIcon />
        </HeaderButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuRadioGroup value={layout} onValueChange={moveTo}>
          {LAYOUTS.map(({ mode, label, icon: Icon }) => (
            <DropdownMenuRadioItem
              key={mode}
              value={mode}
              disabled={mode !== 'float' && !canDock}
            >
              <Icon className="size-4" />
              {t(label)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {!canDock && (
          <DropdownMenuLabel className="pt-1 pl-8 text-xs font-normal text-gray-10">
            {t('Needs a wider window')}
          </DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onOpenFullPage} className="pl-8">
          <Maximize2 className="size-4" />
          {t('Open full page')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FullLayoutMenu({
  onCollapseToSide,
}: {
  onCollapseToSide: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderButton label={t('Panel layout')}>
          <PanelLeft />
        </HeaderButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={onCollapseToSide}>
          <Minimize2 className="size-4" />
          {t('Collapse to side')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MoreMenu({
  hasConversation,
  onRename,
  onDelete,
  onSettings,
}: {
  hasConversation: boolean;
  onRename: () => void;
  onDelete: () => void;
  onSettings: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderButton label={t('More')}>
          <Ellipsis />
        </HeaderButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSettings}>
          <Settings className="size-4" />
          {t('Chat settings')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RenameTitle({
  initial,
  onDone,
}: {
  initial: string;
  onDone: (title: string | null) => void;
}) {
  const [value, setValue] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);
  const done = useRef(false);
  const finish = (next: string | null) => {
    if (done.current) return;
    done.current = true;
    onDone(next);
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.select());
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <input
      ref={inputRef}
      value={value}
      aria-label={t('Chat title')}
      onChange={(event) => setValue(event.target.value)}
      onPointerDown={(event) => event.stopPropagation()}
      onBlur={() => finish(value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          finish(value);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          finish(null);
        }
      }}
      className="-ml-1.5 h-8 min-w-0 rounded-md border bg-gray-1 px-1.5 text-sm font-semibold text-gray-12 outline-none [grid-area:1/1] focus-visible:ring-2 focus-visible:ring-gray-8"
    />
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

function readPinned(): boolean {
  try {
    return localStorage.getItem(PINNED_KEY) === 'true';
  } catch {
    return false;
  }
}

function savePinned(pinned: boolean) {
  try {
    localStorage.setItem(PINNED_KEY, String(pinned));
  } catch {
    return;
  }
}

type LiveTitle = { id: string; title: string; fresh: boolean };

const TOAST_POSITION: Record<ChatWidth, ToastT['position'] | undefined> = {
  full: 'bottom-center',
  closed: undefined,
  left: undefined,
  right: 'bottom-center',
  float: undefined,
  sheet: 'top-center',
};
