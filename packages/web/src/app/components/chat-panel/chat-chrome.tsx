import { t } from 'i18next';
import {
  ArrowLeft,
  FlaskConical,
  History,
  Maximize2,
  PanelLeft,
  PanelRight,
  PictureInPicture2,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Popover as PopoverPrimitive,
  Tooltip as TooltipPrimitive,
} from 'radix-ui';
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { ToastT } from 'sonner';

import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  chatDemo,
  DemoSpeed,
  useChatDemoSettings,
} from '@/features/chat/lib/demo/chat-demo';
import { demoScenarios } from '@/features/chat/lib/demo/demo-scenarios';
import { playDemoScenario } from '@/features/chat/lib/demo/play-scenario';
import {
  ChatLayout,
  DOCK_BREAKPOINT,
} from '@/features/workspace/lib/chat-layout';
import {
  ChatPanelMode,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { CHAT_ROUTE } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import {
  useChatHistoryActions,
  useConversationTitle,
} from './chat-history-data';
import { ChatHistoryList } from './chat-history-list';
import { historyMotion } from './chat-history-motion';
import { ChatHistoryPopover } from './chat-history-popover';
import { ChatPanelEmptyState } from './chat-panel-empty-state';
import {
  defaultFloat,
  FLOAT_DEFAULT,
  fitToWindow,
  useChatLayout,
  useWindowAtLeast,
} from './chat-window';

// `?chatDemo=<scenarioId>` (demo builds only) opens the panel docked so the
// chat mounts, then plays that scenario once. `&chatDock=left|float` picks
// where it opens (right by default).
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

// The panel's header and the chat itself. Rendered once, above the routes, by
// ChatChromeHost, so it survives page changes.
//
// History opens where it fits the panel: docked or in the sheet, it takes over
// the body with the chat kept mounted (and streaming) underneath; floating, it
// drops down from the header so the card keeps its size.
//
// The chat body is memoized and reads nothing from the panel's store: opening,
// closing, dragging and docking re-render only this thin chrome.
export function ChatChrome({
  onDragStart,
}: {
  onDragStart: (event: React.PointerEvent<HTMLElement>) => void;
}) {
  const navigate = useNavigate();
  const layout = useChatLayout();
  const open = useChatPanel((s) => s.open);
  const conversationId = useChatPanel((s) => s.conversationId);
  const reduced = useReducedMotion();
  // The chat box reads its conversation once, when it mounts. A new session
  // starts it fresh; a conversation it creates is only remembered.
  const [session, setSession] = useState<ChatSession>(() => ({
    key: 0,
    conversationId: useChatPanel.getState().conversationId,
  }));
  // History belongs to the layout it was opened in: moving the panel, the
  // window narrowing it to a card, or closing it drops it.
  const [historyIn, setHistoryIn] = useState<ChatLayout | null>(null);
  const [liveTitle, setLiveTitle] = useState<LiveTitle | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const historyButtonRef = useRef<HTMLButtonElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const sheet = layout === 'sheet';
  const dropdown = layout === 'float';
  const historyOpen = open && historyIn === layout;
  const historyView = historyOpen && !dropdown;
  const title = useConversationTitle({
    conversationId,
    liveTitle: liveTitle?.id === conversationId ? liveTitle.title : null,
  });

  // Picking the panel up drops history too, even before it lands anywhere.
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
      useChatPanel.getState().setConversationId(null);
      setSession((s) => ({ key: s.key + 1, conversationId: null, prompt }));
      backToChat();
    },
    [backToChat],
  );
  const openConversation = useCallback(
    (id: string) => {
      if (id !== useChatPanel.getState().conversationId) {
        useChatPanel.getState().setConversationId(id);
        setSession((s) => ({ key: s.key + 1, conversationId: id }));
      }
      backToChat();
    },
    [backToChat],
  );

  // Dev only: a demo scenario opens here, in a fresh chat or a seeded one.
  const { invalidate } = useChatHistoryActions();
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

  // Esc steps back from the history view before it may close the panel. It
  // listens on the document, after a drag's own Esc on the window, and leaves
  // a search with text, a rename or an open menu to handle the key first.
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
    />
  );
  const openFullPage = () => {
    useChatPanel.getState().setOpen(false);
    navigate(conversationId ? `${CHAT_ROUTE}/${conversationId}` : CHAT_ROUTE);
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
            onPointerDown={onDragStart}
            className={cn(
              'group/header relative flex h-14 shrink-0 touch-none items-center gap-2 pr-3 pl-4 select-none',
              sheet ? 'cursor-default' : 'cursor-grab',
            )}
          >
            {/* The grip: a hint on a card or dock, a real handle on a sheet. */}
            <span
              aria-hidden
              className={cn(
                'absolute left-1/2 -translate-x-1/2 rounded-full transition-colors duration-150',
                sheet
                  ? 'top-2 h-1 w-9 bg-gray-6'
                  : 'top-1.5 h-1 w-8 bg-gray-5 group-hover/header:bg-gray-7',
              )}
            />
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
                ) : (
                  <motion.h2
                    key={`chat:${title ?? ''}`}
                    {...titleFade(reduced)}
                    title={title ?? undefined}
                    className="truncate text-sm font-semibold text-gray-12 [grid-area:1/1]"
                  >
                    {title ?? t('New chat')}
                  </motion.h2>
                )}
              </AnimatePresence>
            </div>
            <div className="-mr-1 flex shrink-0 items-center gap-0.5">
              <HeaderButton
                ref={historyButtonRef}
                label={historyOpen ? t('Hide history') : t('History')}
                pressed={historyOpen}
                onClick={() => setHistoryIn(historyOpen ? null : layout)}
              >
                <History />
              </HeaderButton>
              <HeaderButton label={t('New chat')} onClick={() => startFresh()}>
                <Plus />
              </HeaderButton>
              {sheet ? (
                <HeaderButton
                  label={t('Open full page')}
                  onClick={openFullPage}
                >
                  <Maximize2 />
                </HeaderButton>
              ) : (
                <LayoutMenu layout={layout} onOpenFullPage={openFullPage} />
              )}
              <HeaderButton
                label={t('Close')}
                shortcut={TOGGLE_SHORTCUT}
                onClick={() => useChatPanel.getState().setOpen(false)}
              >
                <X />
              </HeaderButton>
            </div>
          </div>
        </PopoverPrimitive.Anchor>
        <ChatHistoryPopover
          open={historyOpen && dropdown}
          headerRef={headerRef}
          triggerRef={historyButtonRef}
          onEscape={focusChat}
        >
          {historyList}
        </ChatHistoryPopover>
      </PopoverPrimitive.Root>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <motion.div
          ref={chatRef}
          inert={historyView}
          aria-hidden={historyView || undefined}
          initial={false}
          animate={
            historyView ? { opacity: 0, x: -shift * 0.6 } : { opacity: 1, x: 0 }
          }
          transition={
            historyView
              ? historyMotion.viewOut(reduced)
              : historyMotion.viewIn(reduced)
          }
          className="absolute inset-0"
        >
          <ChatBody
            session={session}
            onStartFresh={startFresh}
            onLiveTitle={setLiveTitle}
          />
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
    </TooltipProvider>
  );
}

// The chat itself. Its props only change when a chat starts or is switched,
// so nothing the panel does around it re-renders the conversation.
const ChatBody = memo(function ChatBody({
  session,
  onStartFresh,
  onLiveTitle,
}: {
  session: ChatSession;
  onStartFresh: (prompt?: string) => void;
  onLiveTitle: (title: LiveTitle) => void;
}) {
  const { invalidate } = useChatHistoryActions();
  return (
    <AIChatBox
      key={session.key}
      incognito={false}
      compact
      conversationId={session.conversationId}
      initialPrompt={session.prompt}
      onConversationCreated={(id) => {
        useChatPanel.getState().setConversationId(id);
        invalidate();
      }}
      onTitleUpdate={(next) => {
        const id = useChatPanel.getState().conversationId;
        if (id) onLiveTitle({ id, title: next });
        invalidate();
      }}
      emptyState={<ChatPanelEmptyState onPick={onStartFresh} />}
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

// A 32px ghost icon button with a tooltip naming it, and its shortcut if any.
// Extra props pass through, so it can also be a menu's trigger.
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

const TOGGLE_SHORTCUT =
  typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent)
    ? '⌘J'
    : 'Ctrl J';

const LAYOUTS: {
  mode: ChatPanelMode;
  label: string;
  icon: typeof PanelLeft;
}[] = [
  { mode: 'left', label: 'Dock left', icon: PanelLeft },
  { mode: 'right', label: 'Dock right', icon: PanelRight },
  { mode: 'float', label: 'Floating', icon: PictureInPicture2 },
];

// The button shows where the panel sits now, which in a narrow window may not
// be where the user asked for it; the menu says why and moves it, or hands the
// conversation to the full chat page.
function LayoutMenu({
  layout,
  onOpenFullPage,
}: {
  layout: ChatLayout;
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
        {chatDemo.available && <DemoScenariosMenu />}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const DEMO_SPEED_LABELS: Record<DemoSpeed, string> = {
  slow: 'Slow',
  normal: 'Normal',
  instant: 'Instant',
};

// Dev builds only: scripted chats that show every chat state without an AI.
function DemoScenariosMenu() {
  const settings = useChatDemoSettings();
  const { invalidate } = useChatHistoryActions();
  const keepOpen = (event: Event) => event.preventDefault();

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="gap-2">
          <FlaskConical className="size-4" />
          {t('Demo scenarios')}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="max-h-[min(75vh,640px)] w-64 overflow-y-auto">
          {demoScenarios.groups.map((group, index) => (
            <Fragment key={group}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs font-normal text-gray-10">
                {group}
              </DropdownMenuLabel>
              {demoScenarios.all
                .filter((scenario) => scenario.group === group)
                .map((scenario) => (
                  <DropdownMenuItem
                    key={scenario.id}
                    onSelect={() => playDemoScenario(scenario.id)}
                  >
                    {scenario.label}
                  </DropdownMenuItem>
                ))}
            </Fragment>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!settings.lastScenarioId}
            onSelect={() =>
              settings.lastScenarioId &&
              playDemoScenario(settings.lastScenarioId)
            }
          >
            <RotateCcw className="size-4" />
            {t('Replay last')}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {t('Speed: {speed}', {
                speed: t(DEMO_SPEED_LABELS[settings.speed]),
              })}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={settings.speed}
                onValueChange={(value) => {
                  const speed = chatDemo.SPEEDS.find((s) => s === value);
                  if (speed) chatDemo.setSpeed(speed);
                }}
              >
                {chatDemo.SPEEDS.map((speed) => (
                  <DropdownMenuRadioItem
                    key={speed}
                    value={speed}
                    onSelect={keepOpen}
                  >
                    {t(DEMO_SPEED_LABELS[speed])}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuCheckboxItem
            checked={settings.fakeHistory}
            onSelect={keepOpen}
            onCheckedChange={(checked) => {
              chatDemo.setFakeHistory(checked);
              invalidate();
            }}
          >
            {t('Fake chat history')}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={settings.active}
            onSelect={keepOpen}
            onCheckedChange={(checked) => chatDemo.setActive(checked)}
          >
            {t('Demo mode for new chats')}
          </DropdownMenuCheckboxItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  );
}

type ChatSession = {
  key: number;
  conversationId: string | null;
  prompt?: string;
};

type LiveTitle = { id: string; title: string };

// Toasts sit bottom-right; keep the undo toast off the panel's composer.
const TOAST_POSITION: Record<ChatLayout, ToastT['position'] | undefined> = {
  left: undefined,
  right: 'bottom-center',
  float: undefined,
  sheet: 'top-center',
};
