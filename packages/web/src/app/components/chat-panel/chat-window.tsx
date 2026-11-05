import { t } from 'i18next';
import {
  AnimatePresence,
  animate,
  motion,
  motionValue,
  useTransform,
} from 'motion/react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

import {
  ChatLayout,
  DOCK_BREAKPOINT,
  DOCK_MAX_WIDTH,
  DOCK_MIN_WIDTH,
  PAGE_COMFORT_WIDTH,
  cardInnerWidth,
  chatLayoutFor,
  clamp,
  dockWidthFor,
  sidebarWidth,
  startStructuralMove,
} from '@/features/workspace/lib/chat-layout';
import {
  ChatPanelSide,
  FloatPosition,
  FloatSize,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import {
  railOpenAfterDock,
  railOpenNow,
  useRailOpen,
} from '@/features/workspace/lib/rail-collapsed';
import { CHAT_ROUTE } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import { ChatChrome } from './chat-chrome';

// The floating card's size until the user resizes it, and how small it may get.
export const FLOAT_DEFAULT: FloatSize = { width: 400, height: 640 };
const FLOAT_MIN: FloatSize = { width: 320, height: 400 };
const DOCK_DEFAULT_WIDTH = 372;
// A floating panel always keeps this much room from the window's edges.
const EDGE = 16;
// Snapping is a deliberate push toward the window's own edge. Leaving takes a
// little more travel than entering, so the preview never flickers on the line.
const SNAP_ENTER = 72;
const SNAP_EXIT = 120;
// Pointer travel before a press on the header counts as a drag.
const DRAG_THRESHOLD = 4;
// A sheet swiped down past this share of the screen, or flicked faster than
// this (px/ms), closes; anything less springs back.
const SHEET_DISMISS_SHARE = 0.25;
const SHEET_DISMISS_VELOCITY = 0.5;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
// Anything that follows the pointer or comes to rest after a drop.
const SETTLE = { type: 'spring', bounce: 0, visualDuration: 0.25 } as const;
const CARD_ID = 'dashboard-content-container';
// The layout's right gutter, outside the card.
const GUTTER_RIGHT = 8;

// The full chat page has its own chat, so the panel steps aside there.
export function useChatPanelHidden(): boolean {
  return useLocation().pathname.includes(CHAT_ROUTE);
}

// Where the panel sits right now. Re-renders only when that changes, not on
// every resize event.
export function useChatLayout(): ChatLayout {
  const mode = useChatPanel((s) => s.mode);
  return useSyncExternalStore(subscribeToResize, () =>
    chatLayoutFor(mode, window.innerWidth),
  );
}

export function useWindowAtLeast(width: number): boolean {
  return useSyncExternalStore(
    subscribeToResize,
    () => window.innerWidth >= width,
  );
}

function subscribeToResize(onChange: () => void) {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

export function ChatDock({ side }: { side: ChatPanelSide }) {
  const hidden = useChatPanelHidden();
  const layout = useChatLayout();
  const viewport = useViewport();
  const railOpen = useRailOpen();
  const open = useChatPanel((s) => s.open);
  const gesture = useChatPanel((s) => s.gesture);
  const savedWidth = useChatPanel((s) => s.dockWidth);
  const setDockWidth = useChatPanel((s) => s.setDockWidth);
  const [resizing, setResizing] = useState(false);
  const slot = useRef<HTMLDivElement>(null);
  // The slot opens as soon as the panel is headed here; it takes the chat over
  // once the card has settled into it.
  const slotOpen = open && !hidden && layout === side && gesture !== 'dragging';
  const hostsChat = slotOpen && gesture === 'idle';
  const host = useChatHost(hostsChat);
  const cardWidth = cardInnerWidth(viewport.width, railOpen);
  const width = dockWidthFor(savedWidth, cardWidth);

  // Dragging the inner edge sets the width straight on the DOM, with the width
  // transition off, so it tracks the pointer 1:1. It's saved on release.
  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const slotEl = slot.current;
    const hostEl = host.current;
    if (event.button !== 0 || !slotEl || !hostEl) {
      return;
    }
    event.preventDefault();
    const startX = event.clientX;
    const max = Math.min(DOCK_MAX_WIDTH, cardWidth - PAGE_COMFORT_WIDTH);
    let next = width;
    setResizing(true);
    const unlock = lockPointer('col-resize');

    const onMove = (move: PointerEvent) => {
      const delta =
        side === 'left' ? move.clientX - startX : startX - move.clientX;
      next = clamp(width + delta, DOCK_MIN_WIDTH, max);
      slotEl.style.width = `${next}px`;
      hostEl.style.width = `${next}px`;
    };
    const end = (save: boolean) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey, true);
      unlock();
      setResizing(false);
      if (save) {
        setDockWidth(next);
      } else {
        slotEl.style.width = `${width}px`;
        hostEl.style.width = `${width}px`;
      }
    };
    const onUp = () => end(true);
    // Esc puts the edge back where it was, like cancelling a drag.
    const onKey = (key: KeyboardEvent) => {
      if (key.key === 'Escape') {
        key.preventDefault();
        key.stopImmediatePropagation();
        end(false);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey, true);
  };

  return (
    <div
      ref={slot}
      inert={!hostsChat}
      className={cn(
        'relative shrink-0 overflow-hidden max-md:hidden',
        // Same duration and curve as the sidebar, so they move as one.
        !resizing &&
          'transition-[width] duration-[var(--ap-move,200ms)] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
      )}
      style={{ width: slotOpen ? width : 0 }}
    >
      <div
        ref={host}
        className={cn(
          'absolute inset-y-0 [contain:strict]',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
        )}
        style={{ width }}
      />
      {hostsChat && (
        <div
          aria-hidden
          onPointerDown={startResize}
          onDoubleClick={() => setDockWidth(DOCK_DEFAULT_WIDTH)}
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

// Owns everything that isn't a docked slot: the floating card, the mobile
// sheet, the drag, the snap preview, focus and the shortcuts. Mounted once in
// the layout.
export function ChatWindow() {
  const hidden = useChatPanelHidden();
  const layout = useChatLayout();
  const viewport = useViewport();
  const { open, float, floatSize, gesture, toggle, setOpen, mountChat } =
    useChatPanel(
      useShallow((s) => ({
        open: s.open,
        float: s.float,
        floatSize: s.floatSize,
        gesture: s.gesture,
        toggle: s.toggle,
        setOpen: s.setOpen,
        mountChat: s.mountChat,
      })),
    );
  const [zone, setZone] = useState<ChatPanelSide | null>(null);
  const [gripActive, setGripActive] = useState(false);
  const [card] = useState(() => createCardMotion(FLOAT_DEFAULT));
  // The sheet's offset while it's swiped; its enter and exit animate it too.
  const [sheetY] = useState(() => motionValue(0));
  const scrimOpacity = useTransform(sheetY, (y) =>
    clamp(1 - y / window.innerHeight, 0, 1),
  );
  const sheet = layout === 'sheet';
  const floating =
    open && !hidden && !sheet && (layout === 'float' || gesture !== 'idle');
  const sheetOpen = open && !hidden && sheet;
  const floatHost = useChatHost(floating);
  const sheetHost = useChatHost(sheetOpen);

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

  // At rest the card sits where the user left it, refitted to the window.
  useLayoutEffect(() => {
    if (gesture !== 'idle') {
      return;
    }
    const size = fitToWindow(floatSize ?? FLOAT_DEFAULT);
    card.place({
      ...clampToWindow(float ?? defaultFloat(size), size),
      ...size,
    });
  }, [float, floatSize, gesture, viewport, card]);

  useFocusHandoff(open && !hidden);

  // Layout changes made from the menu move the card the same way a drag does:
  // a dock lifts into the card, a card settles into the dock.
  useEffect(() => {
    return useChatPanel.subscribe((state, prev) => {
      if (
        !state.open ||
        !prev.open ||
        state.gesture !== 'idle' ||
        state.mode === prev.mode ||
        window.location.pathname.includes(CHAT_ROUTE)
      ) {
        return;
      }
      const viewportWidth = window.innerWidth;
      const from = chatLayoutFor(prev.mode, viewportWidth);
      const to = chatLayoutFor(state.mode, viewportWidth);
      if (from === 'float' && (to === 'left' || to === 'right')) {
        const target = dockRect(to, railOpenNow());
        if (target) {
          state.setGesture('settling');
          card.settle(target, () => state.setGesture('idle'));
        }
      } else if ((from === 'left' || from === 'right') && to === 'float') {
        const size = fitToWindow(state.floatSize ?? FLOAT_DEFAULT);
        card.place(rectOf(getChatNode()));
        state.setGesture('settling');
        card.settle(
          {
            ...clampToWindow(state.float ?? defaultFloat(size), size),
            ...size,
          },
          () => state.setGesture('idle'),
        );
      }
    });
  }, [card]);

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
      // Esc closes the panel only from inside it; elsewhere it's the page's.
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        useChatPanel.getState().open &&
        getChatNode().contains(document.activeElement) &&
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
      const state = useChatPanel.getState();
      const layoutNow = chatLayoutFor(state.mode, window.innerWidth);
      // React bubbles events from portals (menus, tooltips, the history
      // dropdown) through the header; only a press on the header itself drags.
      if (
        event.button !== 0 ||
        !event.currentTarget.contains(target) ||
        target.closest('button, a, input, textarea, [role^="menuitem"]')
      ) {
        return;
      }
      event.preventDefault();
      if (layoutNow === 'sheet') {
        swipeSheet(event, sheetY);
        return;
      }
      // A press mid-settle catches the card where it is.
      const fromDock = layoutNow !== 'float' && state.gesture === 'idle';
      const from = fromDock ? rectOf(getChatNode()) : card.rect();
      const origin = state.mode;
      const start = { x: event.clientX, y: event.clientY };
      // Keep the grab point under the pointer while the card changes size.
      const grab = {
        ratioX: (start.x - from.x) / from.width,
        y: start.y - from.y,
      };
      const floatTarget = fitToWindow(state.floatSize ?? FLOAT_DEFAULT);
      const unlock = lockPointer('grabbing');
      let pointer = start;
      let moved = false;
      let side: ChatPanelSide | null = null;
      let stopFollow: (() => void) | null = null;

      const follow = () => {
        const size = { width: card.width.get(), height: card.height.get() };
        const position = clampToWindow(
          {
            x: pointer.x - grab.ratioX * size.width,
            y: pointer.y - grab.y,
          },
          size,
        );
        card.x.set(position.x);
        card.y.set(position.y);
      };

      // The card takes over the dock's exact rect on the same frame the slot
      // starts closing, then eases to its floating size under the pointer.
      const lift = () => {
        moved = true;
        card.place(from);
        card.resize(floatTarget);
        stopFollow = card.width.on('change', follow);
        // The slot closes as the card lifts out: an exit.
        startStructuralMove('exit');
        useChatPanel.getState().setGesture('dragging');
      };

      const finish = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        window.removeEventListener('keydown', onKey, true);
        stopFollow?.();
        unlock();
        setZone(null);
      };

      const settleIntoDock = (dockSide: ChatPanelSide) => {
        const panel = useChatPanel.getState();
        // Docking may fold the rail, so read where the dock lands afterwards.
        panel.dock(dockSide);
        const rect = dockRect(dockSide, railOpenNow());
        panel.setGesture('settling');
        if (!rect) {
          panel.setGesture('idle');
          return;
        }
        card.settle(rect, () => useChatPanel.getState().setGesture('idle'));
      };

      const settleFloating = (rect: Rect) => {
        const panel = useChatPanel.getState();
        panel.floatAt({ x: rect.x, y: rect.y });
        panel.setGesture('settling');
        card.settle(rect, () => useChatPanel.getState().setGesture('idle'));
      };

      const onMove = (move: PointerEvent) => {
        pointer = { x: move.clientX, y: move.clientY };
        if (!moved) {
          if (
            Math.hypot(pointer.x - start.x, pointer.y - start.y) <
            DRAG_THRESHOLD
          ) {
            return;
          }
          lift();
        }
        follow();
        const next = snapZone(pointer.x, side);
        if (next !== side) {
          side = next;
          setZone(next);
        }
      };

      const onUp = () => {
        finish();
        if (!moved) {
          return;
        }
        if (side) {
          settleIntoDock(side);
          return;
        }
        const size = floatTarget;
        settleFloating({
          ...clampToWindow(
            { x: pointer.x - grab.ratioX * size.width, y: pointer.y - grab.y },
            size,
          ),
          ...size,
        });
      };

      // Esc or a lost pointer puts the panel back where the drag started.
      const onCancel = () => {
        finish();
        if (!moved) {
          return;
        }
        if (
          origin !== 'float' &&
          chatLayoutFor(origin, window.innerWidth) === origin
        ) {
          settleIntoDock(origin);
        } else {
          settleFloating(from);
        }
      };
      const onKey = (key: KeyboardEvent) => {
        if (key.key !== 'Escape' || !moved) {
          return;
        }
        // First claim on Esc: nothing under a drag should also react to it.
        key.preventDefault();
        key.stopImmediatePropagation();
        onCancel();
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      window.addEventListener('keydown', onKey, true);
    },
    [card, sheetY],
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
      const from = card.rect();
      const unlock = lockPointer('nwse-resize');
      setGripActive(true);

      const onMove = (move: PointerEvent) => {
        card.width.set(
          clamp(
            from.width + move.clientX - start.x,
            FLOAT_MIN.width,
            window.innerWidth - from.x - EDGE,
          ),
        );
        card.height.set(
          clamp(
            from.height + move.clientY - start.y,
            FLOAT_MIN.height,
            window.innerHeight - from.y - EDGE,
          ),
        );
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        unlock();
        setGripActive(false);
        useChatPanel
          .getState()
          .resizeFloat({ width: card.width.get(), height: card.height.get() });
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [card],
  );

  return createPortal(
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
            // A card lifted out of the dock is already there: no fade.
            initial={gesture === 'idle' ? 'hidden' : false}
            animate="shown"
            exit="hidden"
            className={cn(
              'group/float fixed top-0 left-0 z-40 overflow-hidden rounded-xl border bg-gray-1 transition-shadow duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]',
              gesture !== 'idle' && 'will-change-transform',
              gesture === 'dragging'
                ? 'shadow-over'
                : (gesture === 'idle' || layout === 'float') && 'shadow-lift',
            )}
            style={{
              x: card.x,
              y: card.y,
              width: card.width,
              height: card.height,
            }}
          >
            <ResizeGrip active={gripActive} onPointerDown={startResize} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {sheetOpen && (
          // The scrim dims with the sheet's own offset, so a swipe lightens it.
          <motion.div
            key="chat-sheet-scrim"
            aria-hidden
            className="fixed inset-0 z-40"
            style={{ opacity: scrimOpacity }}
          >
            <motion.div
              className="absolute inset-0 bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.16 } }}
              onClick={() => setOpen(false)}
            />
          </motion.div>
        )}
        {sheetOpen && (
          <motion.section
            key="chat-sheet"
            ref={sheetHost}
            aria-label={t('Chat')}
            variants={sheetVariants}
            initial="hidden"
            animate="shown"
            exit="hidden"
            style={{ y: sheetY }}
            className="fixed inset-x-0 top-2 bottom-0 z-40 flex flex-col overflow-hidden rounded-t-xl border bg-gray-1 shadow-over"
          />
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}

const floatCard = {
  hidden: (stillOpen: boolean) =>
    // Handing the chat to a dock: the card is already where the dock is.
    stillOpen
      ? { opacity: 0, transition: { duration: 0 } }
      : prefersReducedMotion()
      ? { opacity: 0, transition: { duration: 0.1 } }
      : {
          opacity: 0,
          scale: 0.98,
          transition: { duration: 0.12, ease: EASE_OUT },
        },
  shown: () => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: prefersReducedMotion() ? 0.1 : 0.18,
      ease: EASE_OUT,
    },
  }),
};

// In pixels, not %, so an exit can pick up from wherever a swipe left it.
const sheetVariants = {
  hidden: () =>
    prefersReducedMotion()
      ? { opacity: 0, transition: { duration: 0.1 } }
      : {
          y: window.innerHeight,
          transition: { duration: 0.2, ease: EASE_OUT },
        },
  shown: () =>
    prefersReducedMotion()
      ? { opacity: 1, y: 0, transition: { duration: 0.1 } }
      : { y: 0, opacity: 1, transition: { duration: 0.28, ease: EASE_OUT } },
};

// The sheet follows a downward swipe 1:1 and resists going up. Let go past a
// quarter of the screen, or with a flick, and it closes; else it springs back.
function swipeSheet(
  event: React.PointerEvent<HTMLElement>,
  sheetY: ReturnType<typeof motionValue<number>>,
) {
  const startY = event.clientY;
  const base = sheetY.get();
  let last = { y: startY, time: event.timeStamp };
  let velocity = 0;
  let moved = false;
  let unlock: (() => void) | null = null;

  const onMove = (move: PointerEvent) => {
    const delta = move.clientY - startY;
    if (!moved) {
      if (Math.abs(delta) < DRAG_THRESHOLD) {
        return;
      }
      moved = true;
      sheetY.stop();
      unlock = lockPointer('grabbing');
    }
    const offset = base + delta;
    sheetY.set(offset >= 0 ? offset : -Math.sqrt(-offset) * 2);
    const elapsed = move.timeStamp - last.time;
    if (elapsed > 0) {
      velocity = (move.clientY - last.y) / elapsed;
      last = { y: move.clientY, time: move.timeStamp };
    }
  };
  const end = (dismiss: boolean) => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    unlock?.();
    if (!moved) {
      return;
    }
    if (dismiss) {
      useChatPanel.getState().setOpen(false);
      return;
    }
    animate(sheetY, 0, SETTLE);
  };
  const onUp = () =>
    end(
      sheetY.get() > window.innerHeight * SHEET_DISMISS_SHARE ||
        velocity > SHEET_DISMISS_VELOCITY,
    );
  const onCancel = () => end(false);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);
}

function ResizeGrip({
  active,
  onPointerDown,
}: {
  active: boolean;
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
        className={cn(
          'absolute right-1 bottom-1 size-2.5 transition-[opacity,color] duration-150 group-hover/float:opacity-100 group-hover/grip:text-gray-11',
          active ? 'text-gray-11 opacity-100' : 'text-gray-8 opacity-0',
        )}
      >
        <path d="M9 3L3 9M9 6.5L6.5 9" />
      </svg>
    </div>
  );
}

// Where the docked panel will land, shown while a drag is over a snap zone.
function SnapPreview({ side }: { side: ChatPanelSide }) {
  const rect = dockRect(side, railOpenAfterDock());
  if (!rect) {
    return null;
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.15 } }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
      transition={{ ease: EASE_OUT }}
      className="pointer-events-none fixed z-30 rounded-lg bg-gray-12/6 ring-1 ring-gray-12/15 ring-inset"
      style={{
        left: rect.x + 6,
        top: rect.y + 6,
        width: rect.width - 12,
        height: rect.height - 12,
      }}
    />
  );
}

// Opening hands focus to the chat input; closing gives it back to wherever it
// was, if the panel had it.
function useFocusHandoff(open: boolean) {
  const wasOpen = useRef(open);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open === wasOpen.current) {
      return;
    }
    wasOpen.current = open;
    if (open) {
      const active = document.activeElement;
      returnTo.current =
        active instanceof HTMLElement && active !== document.body
          ? active
          : null;
      // The chat may still be mounting, so wait for its input to appear.
      let frame = 0;
      let tries = 0;
      const focusInput = () => {
        const input = getChatNode().querySelector<HTMLElement>('textarea');
        if (input && getChatNode().isConnected) {
          input.focus({ preventScroll: true });
          return;
        }
        if (++tries < 60) {
          frame = requestAnimationFrame(focusInput);
        }
      };
      frame = requestAnimationFrame(focusInput);
      return () => cancelAnimationFrame(frame);
    }
    const active = document.activeElement;
    const focusLeftWithPanel =
      !active || active === document.body || getChatNode().contains(active);
    if (focusLeftWithPanel && returnTo.current?.isConnected) {
      returnTo.current.focus({ preventScroll: true });
    }
    returnTo.current = null;
  }, [open]);
}

// The card's position and size as motion values, so following the pointer
// never re-renders React. Every animation retargets from the current value.
function createCardMotion(size: FloatSize) {
  const x = motionValue(0);
  const y = motionValue(0);
  const width = motionValue(size.width);
  const height = motionValue(size.height);
  let running: ReturnType<typeof animate>[] = [];
  let unwatch: (() => void) | null = null;
  let run = 0;

  const stop = () => {
    running.forEach((controls) => controls.stop());
    running = [];
    unwatch?.();
    unwatch = null;
    run++;
  };
  const motionFor = () => (prefersReducedMotion() ? { duration: 0 } : SETTLE);

  return {
    x,
    y,
    width,
    height,
    stop,
    rect: (): Rect => ({
      x: x.get(),
      y: y.get(),
      width: width.get(),
      height: height.get(),
    }),
    place: (rect: Rect) => {
      stop();
      x.set(rect.x);
      y.set(rect.y);
      width.set(rect.width);
      height.set(rect.height);
    },
    resize: (to: FloatSize) => {
      running.push(
        animate(width, to.width, motionFor()),
        animate(height, to.height, motionFor()),
      );
    },
    // A spring's tail runs well past the point where it looks done, so the
    // card is done as soon as it's within half a pixel of the target.
    settle: (to: Rect, done: () => void) => {
      stop();
      const id = run;
      const finish = () => {
        if (run !== id) {
          return;
        }
        unwatch?.();
        unwatch = null;
        done();
      };
      const arrived = () =>
        Math.abs(x.get() - to.x) < 0.5 &&
        Math.abs(y.get() - to.y) < 0.5 &&
        Math.abs(width.get() - to.width) < 0.5 &&
        Math.abs(height.get() - to.height) < 0.5;
      const check = () => {
        if (arrived()) {
          finish();
        }
      };
      const offs = [x, y, width, height].map((value) =>
        value.on('change', check),
      );
      unwatch = () => offs.forEach((off) => off());
      running = [
        animate(x, to.x, motionFor()),
        animate(y, to.y, motionFor()),
        animate(width, to.width, motionFor()),
        animate(height, to.height, motionFor()),
      ];
      void Promise.all(
        running.map(
          (controls) => new Promise<void>((resolve) => controls.then(resolve)),
        ),
      ).then(finish);
    },
  };
}

// The chat lives in one DOM node that moves between the docked slot, the
// floating card and the sheet, so moving the panel never remounts the chat.
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

function useViewport(): { width: number; height: number } {
  const [viewport, setViewport] = useState(readViewport);
  useEffect(() => {
    const onResize = () => setViewport(readViewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return viewport;
}

function readViewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

// While a gesture runs, a shield above everything keeps one cursor and stops
// text selection and hover effects underneath.
function lockPointer(cursor: string): () => void {
  const shield = document.createElement('div');
  shield.style.cssText = `position:fixed;inset:0;z-index:2147483647;cursor:${cursor}`;
  document.body.appendChild(shield);
  const userSelect = document.body.style.userSelect;
  document.body.style.userSelect = 'none';
  return () => {
    shield.remove();
    document.body.style.userSelect = userSelect;
  };
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function fitToWindow(size: FloatSize): FloatSize {
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

export function defaultFloat(size: FloatSize): FloatPosition {
  const card = cardRect();
  return {
    x: (card?.left ?? EDGE) + 24,
    y: window.innerHeight - size.height - 24,
  };
}

// Where a dock on this side sits once the rail has settled, inside the card's
// border. Computed, not measured, since the rail may still be moving.
function dockRect(side: ChatPanelSide, railOpen: boolean): Rect | null {
  const card = cardRect();
  if (!card) {
    return null;
  }
  const viewportWidth = window.innerWidth;
  const width = dockWidthFor(
    useChatPanel.getState().dockWidth,
    cardInnerWidth(viewportWidth, railOpen),
  );
  return {
    x:
      side === 'left'
        ? sidebarWidth(railOpen) + 1
        : viewportWidth - GUTTER_RIGHT - 1 - width,
    y: card.top + 1,
    width,
    height: card.height - 2,
  };
}

function snapZone(
  pointerX: number,
  current: ChatPanelSide | null,
): ChatPanelSide | null {
  if (window.innerWidth < DOCK_BREAKPOINT) {
    return null;
  }
  const reach = (side: ChatPanelSide) =>
    side === current ? SNAP_EXIT : SNAP_ENTER;
  if (pointerX <= reach('left')) {
    return 'left';
  }
  if (pointerX >= window.innerWidth - reach('right')) {
    return 'right';
  }
  return null;
}

function cardRect(): DOMRect | null {
  return document.getElementById(CARD_ID)?.getBoundingClientRect() ?? null;
}

function rectOf(element: HTMLElement): Rect {
  const rect = element.getBoundingClientRect();
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
}

type Rect = FloatPosition & FloatSize;
