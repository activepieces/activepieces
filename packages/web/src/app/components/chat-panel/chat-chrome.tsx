import { t } from 'i18next';
import {
  ArrowLeft,
  History,
  Maximize2,
  PanelLeft,
  PanelRight,
  PictureInPicture2,
  Plus,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Popover as PopoverPrimitive,
  Tooltip as TooltipPrimitive,
} from 'radix-ui';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { defaultFloat, FLOAT_DEFAULT, fitToWindow } from './chat-window';

// The panel's header and the chat itself. Rendered once, above the routes, by
// ChatChromeHost, so it survives page changes.
//
// History opens where it fits the panel: docked, it takes over the body with
// the chat kept mounted (and streaming) underneath; floating, it drops down
// from the header so the card keeps its size.
export function ChatChrome({
  onDragStart,
}: {
  onDragStart: (event: React.PointerEvent<HTMLElement>) => void;
}) {
  const navigate = useNavigate();
  const { open, mode, conversationId, setConversationId, setOpen } =
    useChatPanel();
  const reduced = useReducedMotion();
  const { invalidate } = useChatHistoryActions();
  // The chat box reads its conversation once, when it mounts. A new session
  // starts it fresh; a conversation it creates is only remembered.
  const [session, setSession] = useState<ChatSession>({
    key: 0,
    conversationId,
  });
  // History belongs to the layout it was opened in: moving or closing the
  // panel drops it, without an effect to reset it.
  const [historyIn, setHistoryIn] = useState<ChatPanelMode | null>(null);
  const [liveTitle, setLiveTitle] = useState<LiveTitle | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const historyButtonRef = useRef<HTMLButtonElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const floating = mode === 'float';
  const historyOpen = open && historyIn === mode;
  const historyView = historyOpen && !floating;
  const title = useConversationTitle({
    conversationId,
    liveTitle: liveTitle?.id === conversationId ? liveTitle.title : null,
  });

  const focusChat = () =>
    requestAnimationFrame(() =>
      chatRef.current?.querySelector('textarea')?.focus(),
    );
  const closeHistory = () => setHistoryIn(null);
  const backToChat = () => {
    closeHistory();
    focusChat();
  };
  const startFresh = (prompt?: string) => {
    setConversationId(null);
    setSession((s) => ({ key: s.key + 1, conversationId: null, prompt }));
    backToChat();
  };
  const openConversation = (id: string) => {
    if (id !== conversationId) {
      setConversationId(id);
      setSession((s) => ({ key: s.key + 1, conversationId: id }));
    }
    backToChat();
  };

  // Esc steps back from the docked history before it may close the panel. An
  // input with text gets the key first, to clear itself.
  useEffect(() => {
    if (!historyView) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        (target instanceof HTMLInputElement &&
          (target.value || target.getAttribute('role') !== 'combobox')) ||
        document.querySelector('[role="dialog"], [role="menu"]')
      ) {
        return;
      }
      event.preventDefault();
      closeHistory();
      focusChat();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [historyView]);

  const shift = historyMotion.shift(reduced);
  const historyList = (
    <ChatHistoryList
      className="flex-1"
      currentId={conversationId}
      onSelect={openConversation}
      onNewChat={() => startFresh()}
    />
  );

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={300}>
      <PopoverPrimitive.Root
        open={historyOpen && floating}
        onOpenChange={(next) => !next && closeHistory()}
      >
        <PopoverPrimitive.Anchor asChild>
          <div
            ref={headerRef}
            onPointerDown={onDragStart}
            className="group/header relative flex h-14 shrink-0 cursor-grab touch-none items-center gap-2 pr-3 pl-4 select-none"
          >
            <span
              aria-hidden
              className="absolute top-1.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-gray-5 transition-colors duration-150 group-hover/header:bg-gray-8"
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
                onClick={() => setHistoryIn(historyOpen ? null : mode)}
              >
                <History />
              </HeaderButton>
              <HeaderButton label={t('New chat')} onClick={() => startFresh()}>
                <Plus />
              </HeaderButton>
              <LayoutMenu
                onOpenFullPage={() => {
                  setOpen(false);
                  navigate(
                    conversationId
                      ? `${CHAT_ROUTE}/${conversationId}`
                      : CHAT_ROUTE,
                  );
                }}
              />
              <HeaderButton
                label={t('Close')}
                shortcut={TOGGLE_SHORTCUT}
                onClick={() => setOpen(false)}
              >
                <X />
              </HeaderButton>
            </div>
          </div>
        </PopoverPrimitive.Anchor>
        <ChatHistoryPopover
          open={historyOpen && floating}
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
          <AIChatBox
            key={session.key}
            incognito={false}
            compact
            conversationId={session.conversationId}
            initialPrompt={session.prompt}
            onConversationCreated={(id) => {
              setConversationId(id);
              invalidate();
            }}
            onTitleUpdate={(next) => {
              const id = useChatPanel.getState().conversationId;
              if (id) setLiveTitle({ id, title: next });
              invalidate();
            }}
            emptyState={<ChatPanelEmptyState onPick={startFresh} />}
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
              className="absolute inset-0 flex flex-col pt-1"
            >
              {historyList}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

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
            'text-gray-11 transition-colors duration-150 active:bg-gray-5',
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

// The button shows where the panel sits now; its menu moves it, or hands the
// conversation to the full chat page.
function LayoutMenu({ onOpenFullPage }: { onOpenFullPage: () => void }) {
  const { mode, float, floatSize, dock, floatAt } = useChatPanel();
  const CurrentIcon =
    LAYOUTS.find((layout) => layout.mode === mode)?.icon ?? PanelLeft;

  const moveTo = (next: string) => {
    if (next === 'left' || next === 'right') {
      dock(next);
      return;
    }
    const size = fitToWindow(floatSize ?? FLOAT_DEFAULT);
    floatAt(float ?? defaultFloat(size));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderButton label={t('Panel layout')}>
          <CurrentIcon />
        </HeaderButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuRadioGroup value={mode} onValueChange={moveTo}>
          {LAYOUTS.map(({ mode: layout, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={layout} value={layout}>
              <Icon className="size-4" />
              {t(label)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onOpenFullPage} className="pl-8">
          <Maximize2 className="size-4" />
          {t('Open full page')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type ChatSession = {
  key: number;
  conversationId: string | null;
  prompt?: string;
};

type LiveTitle = { id: string; title: string };
