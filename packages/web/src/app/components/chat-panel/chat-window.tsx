import { t } from 'i18next';
import {
  Maximize2,
  PanelLeft,
  PanelRight,
  PictureInPicture2,
  Plus,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useMotionValue } from 'motion/react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';

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
  ChatPanelMode,
  ChatPanelSide,
  FloatPosition,
  FloatSize,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { CHAT_ROUTE } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import { ChatPanelEmptyState } from './chat-panel-empty-state';

// A docked panel's width limits. It also never takes more than half the card.
const DOCK_MIN_WIDTH = 320;
const DOCK_MAX_WIDTH = 640;
// The floating card's size until the user resizes it, and how small it may get.
const FLOAT_DEFAULT: FloatSize = { width: 400, height: 640 };
const FLOAT_MIN: FloatSize = { width: 320, height: 400 };
// A floating panel always keeps this much room from the window's edges.
const EDGE = 16;
// Snapping is a deliberate push: the pointer has to reach the window's own
// left or right edge. Short of that the card just floats, so it can also sit
// flush in a corner.
const SNAP_EDGE = 96;
// Pointer travel before a press on the header counts as a drag.
const DRAG_THRESHOLD = 4;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const CARD_ID = 'dashboard-content-container';

// The full chat page has its own chat, so the panel steps aside there.
export function useChatPanelHidden(): boolean {
  return useLocation().pathname.includes(CHAT_ROUTE);
}

export function ChatDock({ side }: { side: ChatPanelSide }) {
  const hidden = useChatPanelHidden();
  const active =
    useChatPanel((s) => s.open && s.mode === side && !s.dragging) && !hidden;
  const savedWidth = useChatPanel((s) => s.dockWidth);
  const setDockWidth = useChatPanel((s) => s.setDockWidth);
  const [resizing, setResizing] = useState(false);
  const slot = useRef<HTMLDivElement>(null);
  const host = useChatHost(active);
  const width = clampDockWidth(savedWidth);

  // Dragging the inner edge sets the width straight on the DOM, with the width
  // transition off, so it tracks the pointer. It's saved on release.
  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const slotEl = slot.current;
    const hostEl = host.current;
    if (event.button !== 0 || !slotEl || !hostEl) {
      return;
    }
    event.preventDefault();
    const startX = event.clientX;
    let next = width;
    setResizing(true);
    document.body.style.cursor = 'col-resize';

    const onMove = (move: PointerEvent) => {
      const delta =
        side === 'left' ? move.clientX - startX : startX - move.clientX;
      next = clampDockWidth(width + delta);
      slotEl.style.width = `${next}px`;
      hostEl.style.width = `${next}px`;
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.body.style.cursor = '';
      setResizing(false);
      setDockWidth(next);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  return (
    <div
      ref={slot}
      inert={!active}
      className={cn(
        'relative shrink-0 overflow-hidden max-md:hidden',
        !resizing &&
          'transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
      )}
      style={{ width: active ? width : 0 }}
    >
      <div
        ref={host}
        className={cn(
          'absolute inset-y-0 transition-[opacity,translate] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          active && 'translate-x-0 opacity-100 delay-50',
          !active && 'opacity-0',
          !active && (side === 'left' ? '-translate-x-2' : 'translate-x-2'),
        )}
        style={{ width }}
      />
      {active && (
        <div
          aria-hidden
          onPointerDown={startResize}
          className={cn(
            'group/edge absolute inset-y-0 z-10 w-2 cursor-col-resize touch-none',
            side === 'left' ? 'right-0' : 'left-0',
          )}
        >
          <span
            className={cn(
              'absolute inset-y-0 w-0.5 bg-gray-8 transition-opacity duration-150 group-hover/edge:opacity-100',
              side === 'left' ? 'right-0' : 'left-0',
              resizing ? 'opacity-100' : 'opacity-0',
            )}
          />
        </div>
      )}
    </div>
  );
}

// Owns the chat itself. It sits above the routes and mounts once, so the chat
// keeps its conversation, scroll and any reply in flight across pages. Each
// page's layout only hosts the node it renders into.
export function ChatChromeHost() {
  const mounted = useChatPanel((s) => s.chatMounted);
  if (!mounted) {
    return null;
  }
  return createPortal(
    <ChatChrome onDragStart={(event) => dragStartHandler.current?.(event)} />,
    getChatNode(),
  );
}

const dragStartHandler: {
  current: ((event: React.PointerEvent<HTMLElement>) => void) | null;
} = { current: null };

// Owns everything that isn't a docked slot: the chat itself, the floating card,
// the drag, the snap preview and the shortcuts. Mounted once in the layout.
export function ChatWindow() {
  const hidden = useChatPanelHidden();
  const {
    open,
    mode,
    float,
    dragging,
    toggle,
    setOpen,
    dock,
    floatAt,
    floatSize,
    resizeFloat,
    setDragging,
    mountChat,
  } = useChatPanel();
  const [zone, setZone] = useState<ChatPanelSide | null>(null);
  const viewport = useViewport();
  const size = fitToWindow(floatSize ?? FLOAT_DEFAULT);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const width = useMotionValue(size.width);
  const height = useMotionValue(size.height);
  const floating = open && !hidden && (mode === 'float' || dragging);
  const floatHost = useChatHost(floating);

  // Build the chat once the page is idle, not when the panel opens: mounting
  // it mid-animation makes the open stutter.
  useEffect(() => {
    if (open) {
      mountChat();
      return;
    }
    const prewarm = setTimeout(mountChat, 800);
    return () => clearTimeout(prewarm);
  }, [open, mountChat]);

  useLayoutEffect(() => {
    if (dragging) {
      return;
    }
    const fitted = fitToWindow(floatSize ?? FLOAT_DEFAULT);
    const position = clampToWindow(float ?? defaultFloat(fitted), fitted);
    width.set(fitted.width);
    height.set(fitted.height);
    x.set(position.x);
    y.set(position.y);
  }, [float, floatSize, dragging, viewport, x, y, width, height]);

  useEffect(() => {
    if (hidden) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (
        mod &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === 'j'
      ) {
        event.preventDefault();
        toggle();
        return;
      }
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        useChatPanel.getState().open &&
        !document.querySelector('[role="dialog"], [role="menu"]')
      ) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hidden, toggle, setOpen]);

  const startDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      if (event.button !== 0 || target.closest('button')) {
        return;
      }
      event.preventDefault();
      const rect = getChatNode().getBoundingClientRect();
      const start = { x: event.clientX, y: event.clientY };
      // Keep the grab point under the pointer as the panel lifts into a card.
      const grab = {
        x: Math.min(Math.max(start.x - rect.left, 24), width.get() - 24),
        y: start.y - rect.top,
      };
      let moved = false;
      let dropSide: ChatPanelSide | null = null;

      const onMove = (move: PointerEvent) => {
        if (!moved) {
          const travel = Math.hypot(
            move.clientX - start.x,
            move.clientY - start.y,
          );
          if (travel < DRAG_THRESHOLD) {
            return;
          }
          moved = true;
          document.body.style.cursor = 'grabbing';
          setDragging(true);
        }
        const position = clampToWindow(
          { x: move.clientX - grab.x, y: move.clientY - grab.y },
          { width: width.get(), height: height.get() },
        );
        x.set(position.x);
        y.set(position.y);
        const next = snapZone(move.clientX);
        if (next !== dropSide) {
          dropSide = next;
          setZone(next);
        }
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        if (!moved) {
          return;
        }
        document.body.style.cursor = '';
        setZone(null);
        if (dropSide) {
          dock(dropSide);
        } else {
          floatAt({ x: x.get(), y: y.get() });
        }
        setDragging(false);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [dock, floatAt, setDragging, x, y, width, height],
  );

  useEffect(() => {
    dragStartHandler.current = startDrag;
  }, [startDrag]);

  // The corner grip resizes from the top-left anchor, never past the window.
  const startResize = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const start = { x: event.clientX, y: event.clientY };
      const from = { width: width.get(), height: height.get() };
      document.body.style.cursor = 'nwse-resize';

      const onMove = (move: PointerEvent) => {
        width.set(
          clamp(
            from.width + move.clientX - start.x,
            FLOAT_MIN.width,
            window.innerWidth - x.get() - EDGE,
          ),
        );
        height.set(
          clamp(
            from.height + move.clientY - start.y,
            FLOAT_MIN.height,
            window.innerHeight - y.get() - EDGE,
          ),
        );
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        document.body.style.cursor = '';
        resizeFloat({ width: width.get(), height: height.get() });
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [resizeFloat, x, y, width, height],
  );

  return (
    <>
      {createPortal(
        <>
          <AnimatePresence>
            {zone && <SnapPreview key={zone} side={zone} />}
          </AnimatePresence>
          <AnimatePresence custom={open}>
            {floating && (
              <motion.div
                key="chat-float"
                ref={floatHost}
                custom={open}
                variants={floatCard}
                initial="hidden"
                animate="shown"
                exit="hidden"
                className={cn(
                  'group/float fixed top-0 left-0 z-40 overflow-hidden rounded-xl border bg-gray-1 transition-shadow duration-150',
                  dragging ? 'shadow-over' : 'shadow-lift',
                )}
                style={{ x, y, width, height }}
              >
                <ResizeGrip onPointerDown={startResize} />
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body,
      )}
    </>
  );
}

// Closing fades the card out. Docking it hands the chat to the slot at once,
// so the empty card just goes.
const floatCard = {
  hidden: (stillOpen: boolean) =>
    stillOpen
      ? { opacity: 0, transition: { duration: 0 } }
      : {
          opacity: 0,
          scale: 0.98,
          transition: { duration: 0.15, ease: EASE_OUT },
        },
  shown: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.15, ease: EASE_OUT },
  },
};

function ResizeGrip({
  onPointerDown,
}: {
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
}) {
  return (
    <div
      aria-hidden
      onPointerDown={onPointerDown}
      className="group/grip absolute right-0 bottom-0 z-10 size-4 cursor-nwse-resize touch-none"
    >
      <svg
        viewBox="0 0 10 10"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        className="absolute right-1 bottom-1 size-2.5 text-gray-8 opacity-0 transition-[opacity,color] duration-150 group-hover/float:opacity-100 group-hover/grip:text-gray-11"
      >
        <path d="M9 3L3 9M9 6.5L6.5 9" />
      </svg>
    </div>
  );
}

function ChatChrome({
  onDragStart,
}: {
  onDragStart: (event: React.PointerEvent<HTMLElement>) => void;
}) {
  const navigate = useNavigate();
  const { conversationId, setConversationId, setOpen } = useChatPanel();
  // The chat box reads its conversation once, when it mounts. A new session
  // starts it fresh; a conversation it creates is only remembered.
  const [session, setSession] = useState<ChatSession>({
    key: 0,
    conversationId,
  });
  const startFresh = (prompt?: string) => {
    setConversationId(null);
    setSession((s) => ({ key: s.key + 1, conversationId: null, prompt }));
  };

  return (
    <>
      <div
        onPointerDown={onDragStart}
        className="group/header relative flex h-14 shrink-0 cursor-grab touch-none items-center gap-0.5 pr-3 pl-4 select-none"
      >
        <span
          aria-hidden
          className="absolute top-1.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-gray-5 transition-colors duration-150 group-hover/header:bg-gray-8"
        />
        <h2 className="grow text-base font-semibold">{t('Chat')}</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('New chat')}
          title={t('New chat')}
          onClick={() => startFresh()}
        >
          <Plus className="size-4" />
        </Button>
        <LayoutMenu
          onOpenFullPage={() => {
            setOpen(false);
            navigate(
              conversationId ? `${CHAT_ROUTE}/${conversationId}` : CHAT_ROUTE,
            );
          }}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('Close')}
          title={t('Close')}
          onClick={() => setOpen(false)}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <AIChatBox
          key={session.key}
          incognito={false}
          compact
          conversationId={session.conversationId}
          initialPrompt={session.prompt}
          onConversationCreated={setConversationId}
          emptyState={<ChatPanelEmptyState onPick={startFresh} />}
        />
      </div>
    </>
  );
}

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
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('Panel layout')}
          title={t('Panel layout')}
        >
          <CurrentIcon className="size-4" />
        </Button>
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

// Where the docked panel will land, shown while a drag is over a snap zone.
function SnapPreview({ side }: { side: ChatPanelSide }) {
  const card = cardRect();
  const width = clampDockWidth(useChatPanel.getState().dockWidth);
  if (!card) {
    return null;
  }
  // Docking on the left folds the sidebar, which moves the card's left edge.
  const left =
    side === 'left' ? card.left - sidebarFoldShift() : card.right - width;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15, ease: EASE_OUT }}
      className="pointer-events-none fixed z-30 rounded-lg bg-gray-12/6 ring-1 ring-gray-12/15 ring-inset"
      style={{
        left: left + 6,
        top: card.top + 6,
        width: width - 12,
        height: card.height - 12,
      }}
    />
  );
}

// The chat lives in one DOM node that moves between the docked slot and the
// floating card, so moving the panel never remounts the chat.
let chatNode: HTMLDivElement | null = null;
function getChatNode(): HTMLDivElement {
  if (!chatNode) {
    chatNode = document.createElement('div');
    chatNode.className = 'flex h-full w-full flex-col';
  }
  return chatNode;
}

function useChatHost(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (active && ref.current) {
      ref.current.appendChild(getChatNode());
    }
  }, [active]);
  return ref;
}

// Re-renders on window resize, so the floating card refits the window.
function useViewport(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const onResize = () => setVersion((v) => v + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return version;
}

function fitToWindow(size: FloatSize): FloatSize {
  return {
    width: clamp(size.width, FLOAT_MIN.width, window.innerWidth - EDGE * 2),
    height: clamp(size.height, FLOAT_MIN.height, window.innerHeight - EDGE * 2),
  };
}

function clampToWindow(
  position: FloatPosition,
  size: FloatSize,
): FloatPosition {
  return {
    x: clamp(position.x, EDGE, window.innerWidth - size.width - EDGE),
    y: clamp(position.y, EDGE, window.innerHeight - size.height - EDGE),
  };
}

function defaultFloat(size: FloatSize): FloatPosition {
  const card = cardRect();
  return {
    x: (card?.left ?? EDGE) + 24,
    y: window.innerHeight - size.height - 24,
  };
}

export function clampDockWidth(width: number): number {
  const card = cardRect();
  const max = Math.min(DOCK_MAX_WIDTH, card ? card.width / 2 : DOCK_MAX_WIDTH);
  return clamp(width, DOCK_MIN_WIDTH, max);
}

function snapZone(pointerX: number): ChatPanelSide | null {
  if (pointerX <= SNAP_EDGE) {
    return 'left';
  }
  if (pointerX >= window.innerWidth - SNAP_EDGE) {
    return 'right';
  }
  return null;
}

function cardRect(): DOMRect | null {
  return document.getElementById(CARD_ID)?.getBoundingClientRect() ?? null;
}

// How far the card's left edge moves when the sidebar folds to its rail.
function sidebarFoldShift(): number {
  const gap = document.querySelector<HTMLElement>('[data-slot=sidebar-gap]');
  if (!gap) {
    return 0;
  }
  const icon = cssLengthToPx(
    getComputedStyle(gap).getPropertyValue('--sidebar-width-icon'),
  );
  return Math.max(0, gap.getBoundingClientRect().width - icon);
}

export function cssLengthToPx(value: string): number {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return value.trim().endsWith('rem')
    ? parseFloat(value) * rem
    : parseFloat(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

type ChatSession = {
  key: number;
  conversationId: string | null;
  prompt?: string;
};
