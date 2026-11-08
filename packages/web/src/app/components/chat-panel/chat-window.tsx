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
  MOBILE_BREAKPOINT,
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
  railOpenNow,
  useRailOpen,
} from '@/features/workspace/lib/rail-collapsed';
import { CHAT_ROUTE } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import { ChatChrome } from './chat-chrome';
import { ChatDemoCorner } from './chat-demo-corner';
import { FollowAlongController } from './follow-along-controller';

// The floating card's size until the user resizes it, and how small it may get.
export const FLOAT_DEFAULT: FloatSize = { width: 400, height: 640 };
const FLOAT_MIN: FloatSize = { width: 320, height: 400 };
const DOCK_DEFAULT_WIDTH = 372;
// A floating panel always keeps this much room from the window's edges.
const EDGE = 16;
// The card snaps when its own edge reaches the page's edge (beside the
// sidebar), or when the pointer reaches the window's edge. No dwell: the
// preview shows at once, and releasing docks. Hold Alt to place it freely.
const SNAP_REACH = 48;
// An armed zone reaches a little further, so the preview never flickers on
// the line.
const SNAP_HOLD = 24;
const POINTER_EDGE = 24;
// Too narrow to dock: a push this close to the window's edge says why.
const EDGE_PUSH = 24;
// Pointer travel before a press on the header counts as a drag.
const DRAG_THRESHOLD = 4;
// A sheet swiped down past this share of the screen, or flicked faster than
// this (px/ms), closes; anything less springs back.
const SHEET_DISMISS_SHARE = 0.25;
const SHEET_DISMISS_VELOCITY = 0.5;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
// The snap preview and the narrow-window hint come and go quickly.
const CUE_MOTION = { duration: 0.12, ease: EASE_OUT };
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
  return (
    <>
      <FollowAlongController />
      {mounted &&
        createPortal(
          <ChatChrome
            onDragStart={(event) => dragStartHandler.current?.(event)}
          />,
          getChatNode(),
        )}
    </>
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
  const [snap, setSnap] = useState<SnapCue | null>(null);
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
      let stopFollow: (() => void) | null = null;
      // Zone geometry is computed here and on resize, never read from layout
      // while the pointer moves.
      let geometry = snapGeometry();
      let zone: SnapTarget | null = null;
      let armed = false;
      let alt = event.altKey;
      const showCue = () =>
        setSnap(armed && zone ? cueFor(zone, geometry) : null);
      // Measured from where the floating card sits under the pointer, so the
      // card's own edge decides, not the grab point.
      const updateSnap = () => {
        const left = pointer.x - grab.ratioX * floatTarget.width;
        const next = alt
          ? null
          : snapTarget(
              { left, right: left + floatTarget.width, pointerX: pointer.x },
              geometry,
              zone,
            );
        if (next !== zone) {
          zone = next;
          armed = zone !== null;
          showCue();
        }
      };

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
        window.removeEventListener('keyup', onKeyUp, true);
        window.removeEventListener('resize', onResize);
        stopFollow?.();
        unlock();
        setSnap(null);
      };

      // A cancel goes back to the dock it came from without docking again, so
      // the rail stays as it was.
      const settleIntoDock = (dockSide: ChatPanelSide, redock = true) => {
        const panel = useChatPanel.getState();
        // Docking folds the rail, so read where the dock lands afterwards.
        if (redock) {
          panel.dock(dockSide);
        }
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
        alt = move.altKey;
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
        updateSnap();
      };

      const onUp = () => {
        // Only a visible preview snaps; anything else drops as floating.
        const side = armed && zone !== 'narrow' ? zone : null;
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
          settleIntoDock(origin, false);
        } else {
          settleFloating(from);
        }
      };
      const onKey = (key: KeyboardEvent) => {
        // Holding Alt (Option) turns snapping off for as long as it's held.
        if (key.key === 'Alt') {
          key.preventDefault();
          alt = true;
          if (moved) {
            updateSnap();
          }
          return;
        }
        if (key.key !== 'Escape' || !moved) {
          return;
        }
        // First claim on Esc: nothing under a drag should also react to it.
        key.preventDefault();
        key.stopImmediatePropagation();
        onCancel();
      };
      const onKeyUp = (key: KeyboardEvent) => {
        if (key.key === 'Alt') {
          alt = false;
          if (moved) {
            updateSnap();
          }
        }
      };
      // The zones and the preview follow the window as it resizes.
      const onResize = () => {
        geometry = snapGeometry();
        if (moved) {
          updateSnap();
          showCue();
        }
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('keyup', onKeyUp, true);
      window.addEventListener('resize', onResize);
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
      <ChatDemoCorner />
      <AnimatePresence>
        {snap?.kind === 'dock' && (
          <SnapPreview key={snap.side} rect={snap.rect} />
        )}
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
            <AnimatePresence>
              {snap?.kind === 'narrow' && <NarrowHint />}
            </AnimatePresence>
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

// Exactly where the docked panel will land, shown once a zone is armed.
function SnapPreview({ rect }: { rect: Rect }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={CUE_MOTION}
      className="pointer-events-none fixed z-30 rounded-xl border-2 border-accent-8 bg-accent-3/70 shadow-lift"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}

// Pushing to the edge of a window too narrow to dock says why nothing snaps.
function NarrowHint() {
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={CUE_MOTION}
      className="pointer-events-none absolute inset-x-0 top-14 z-20 flex justify-center"
    >
      <span className="rounded-full bg-gray-12/85 px-2.5 py-1 text-xs font-medium text-gray-1 shadow-lift">
        {t('Widen the window to dock')}
      </span>
    </motion.div>
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
    // Lets follow-along tell typing in the chat from typing in the page.
    chatNode.dataset.chatRoot = '';
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
  return card ? dockRectIn(card, side, railOpen) : null;
}

function dockRectIn(
  card: CardSpan,
  side: ChatPanelSide,
  railOpen: boolean,
): Rect {
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

// Everything a drag needs to place the zones and the preview, read once.
// The zones sit at the page card's edges as they are once any move settles:
// the rail never moves during a drag, and the slot a docked panel leaves is
// inside the card. Docking always folds the rail, so the preview shows the
// dock beside the folded rail.
function snapGeometry(): SnapGeometry {
  const viewport = window.innerWidth;
  const card = cardRect();
  return {
    viewport,
    dockable: viewport >= DOCK_BREAKPOINT,
    leftEdge: sidebarWidth(railOpenNow()),
    rightEdge: viewport - GUTTER_RIGHT,
    previews: card
      ? {
          left: dockRectIn(card, 'left', false),
          right: dockRectIn(card, 'right', false),
        }
      : null,
  };
}

function snapTarget(
  at: { left: number; right: number; pointerX: number },
  geometry: SnapGeometry,
  current: SnapTarget | null,
): SnapTarget | null {
  const hold = (target: SnapTarget) => (target === current ? SNAP_HOLD : 0);
  if (!geometry.dockable) {
    if (geometry.viewport < MOBILE_BREAKPOINT) {
      return null;
    }
    const reach = EDGE_PUSH + hold('narrow');
    return at.pointerX <= reach || at.pointerX >= geometry.viewport - reach
      ? 'narrow'
      : null;
  }
  if (
    at.left <= geometry.leftEdge + SNAP_REACH + hold('left') ||
    at.pointerX <= POINTER_EDGE
  ) {
    return 'left';
  }
  if (
    at.right >= geometry.rightEdge - SNAP_REACH - hold('right') ||
    at.pointerX >= geometry.viewport - POINTER_EDGE
  ) {
    return 'right';
  }
  return null;
}

function cueFor(target: SnapTarget, geometry: SnapGeometry): SnapCue | null {
  if (target === 'narrow') {
    return { kind: 'narrow' };
  }
  const rect = geometry.previews?.[target];
  return rect ? { kind: 'dock', side: target, rect } : null;
}

function cardRect(): DOMRect | null {
  return document.getElementById(CARD_ID)?.getBoundingClientRect() ?? null;
}

function rectOf(element: HTMLElement): Rect {
  const rect = element.getBoundingClientRect();
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
}

type Rect = FloatPosition & FloatSize;
type CardSpan = { top: number; height: number };
type SnapTarget = ChatPanelSide | 'narrow';
type SnapCue =
  | { kind: 'dock'; side: ChatPanelSide; rect: Rect }
  | { kind: 'narrow' };
type SnapGeometry = {
  viewport: number;
  dockable: boolean;
  leftEdge: number;
  rightEdge: number;
  previews: Record<ChatPanelSide, Rect> | null;
};
