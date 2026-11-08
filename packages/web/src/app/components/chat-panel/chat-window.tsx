import { isObject } from '@activepieces/core-utils';
import { t } from 'i18next';
import {
  AnimatePresence,
  animate,
  motion,
  motionValue,
  useTransform,
} from 'motion/react';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { ToasterProps } from 'sonner';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { describeChange } from '@/app/routes/chat-with-ai/components/changes-summary';
import { useResourceName } from '@/app/routes/chat-with-ai/components/resource-chip';
import { ChatSparkIcon } from '@/components/icons/chat-spark';
import { ChangeLine } from '@/features/chat/lib/resources/change-summary';
import { resourceRegistry } from '@/features/chat/lib/resources/registry';
import { useConversationChanges } from '@/features/chat/lib/use-conversation-changes';
import {
  ChatWidth,
  chatLayoutUtils,
} from '@/features/workspace/lib/chat-layout';
import {
  chatPanelUtils,
  ChatPanelSide,
  FloatPosition,
  FloatSize,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import {
  railOpenNow,
  useRailOpen,
} from '@/features/workspace/lib/rail-collapsed';
import { windowSizeHooks } from '@/features/workspace/lib/window-size-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { useShellHandle } from '../app-shell';

import { ChatChrome, ChatLastPageTracker } from './chat-chrome';
import { chatDom } from './chat-dom';
import { FollowAlongController } from './follow-along-controller';

export function useChatWidth(): ChatWidth {
  const fullPage = useShellHandle().chat === 'full';
  const open = useChatPanel((s) => s.open);
  const mode = useChatPanel((s) => s.mode);
  const split = useChatPanel((s) => s.split);
  return useSyncExternalStore(windowSizeHooks.subscribe, () =>
    chatLayoutUtils.widthFor({
      fullPage,
      open,
      mode,
      split,
      viewportWidth: window.innerWidth,
    }),
  );
}

export function useChatToastPlacement(): ToastPlacement {
  return useToastPlacement(
    useShallow((state) => ({
      position: state.position,
      offset: state.offset,
    })),
  );
}

export function ChatDock({ side }: { side: ChatPanelSide }) {
  const chatWidth = useChatWidth();
  const viewport = windowSizeHooks.useSize();
  const railOpen = useRailOpen();
  const gesture = useChatPanel((s) => s.gesture);
  const savedWidth = useChatPanel((s) => s.dockWidth);
  const setDockWidth = useChatPanel((s) => s.setDockWidth);
  const moving = useChatPanel((s) => s.moving !== null);
  const [resizing, setResizing] = useState(false);
  const slot = useRef<HTMLDivElement>(null);
  const full = chatWidth === 'full' && side === 'left';
  const slotOpen = full || (chatWidth === side && gesture !== 'dragging');
  const hostsChat = full || (slotOpen && gesture === 'idle');
  const host = useChatHost(hostsChat);
  const cardWidth = chatLayoutUtils.cardInnerWidth({
    viewportWidth: viewport.width,
    railOpen,
  });
  const width = chatLayoutUtils.dockWidthFor({ savedWidth, cardWidth });

  useStructuralMove({
    slot,
    host,
    enabled: side === 'left',
    chatWidth,
    slotWidth: full ? '100%' : slotOpen ? `${width}px` : '0px',
    hostWidth: full ? '100%' : `${width}px`,
    resizing,
  });

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const slotEl = slot.current;
    const hostEl = host.current;
    if (event.button !== 0 || !slotEl || !hostEl) {
      return;
    }
    event.preventDefault();
    const startX = event.clientX;
    const max = Math.min(
      chatLayoutUtils.DOCK_MAX_WIDTH,
      cardWidth - chatLayoutUtils.PAGE_COMFORT_WIDTH,
    );
    let next = width;
    setResizing(true);
    const unlock = lockPointer('col-resize');

    const onMove = (move: PointerEvent) => {
      const delta =
        side === 'left' ? move.clientX - startX : startX - move.clientX;
      next = chatLayoutUtils.clamp({
        value: width + delta,
        min: chatLayoutUtils.DOCK_MIN_WIDTH,
        max,
      });
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
      data-chat-slot={side}
      className={cn(
        'relative shrink-0 overflow-hidden',
        moving && side === 'left' && 'z-[1] bg-inherit',
        !full && 'max-md:hidden',
        !resizing &&
          'transition-[width] duration-[var(--ap-move,200ms)] ease-move motion-reduce:transition-none',
      )}
    >
      <div
        ref={host}
        className={cn(
          'absolute inset-y-0 [contain:strict]',
          side === 'left' ? 'left-0' : 'right-0',
          !full && (side === 'left' ? 'border-r' : 'border-l'),
        )}
      />
      {hostsChat && !full && (
        <div
          aria-hidden
          onPointerDown={startResize}
          onDoubleClick={() => setDockWidth(chatLayoutUtils.DOCK_DEFAULT_WIDTH)}
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

function useStructuralMove({
  slot,
  host,
  enabled,
  chatWidth,
  slotWidth,
  hostWidth,
  resizing,
}: {
  slot: React.RefObject<HTMLDivElement | null>;
  host: React.RefObject<HTMLDivElement | null>;
  enabled: boolean;
  chatWidth: ChatWidth;
  slotWidth: string;
  hostWidth: string;
  resizing: boolean;
}) {
  const previous = useRef(chatWidth);
  const phase = useRef<MovePhase>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const target = useRef({ slotWidth, hostWidth });
  target.current = { slotWidth, hostWidth };

  useLayoutEffect(() => {
    const slotEl = slot.current;
    const hostEl = host.current;
    const from = previous.current;
    previous.current = chatWidth;
    if (!slotEl || !hostEl || resizing) return;
    const settle = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      slotEl.style.transition = '';
      if (phase.current === 'exit') {
        rewrap(() => {
          hostEl.style.width = target.current.hostWidth;
        });
      }
      phase.current = 'idle';
      useChatPanel.getState().setMoving(null);
    };
    const settleLater = (ms: number) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(settle, ms);
    };
    const kind =
      enabled && from === 'full' && chatWidth === 'left'
        ? 'enter'
        : enabled && from === 'left' && chatWidth === 'full'
        ? 'exit'
        : null;

    if (kind && chatLayoutUtils.prefersReducedMotion()) {
      phase.current = 'idle';
      captureAnchor();
      slotEl.style.transition = 'none';
      slotEl.style.width = slotWidth;
      hostEl.style.width = hostWidth;
      restoreAnchor();
      settle();
    } else if (kind === 'enter') {
      useChatPanel.getState().setMoving('enter');
      if (phase.current === 'exit') {
        slotEl.style.transition = `width ${MOVE_MS.wide}ms ${MOVE_EASE.emphasized}`;
      } else {
        captureAnchor();
        hostEl.style.width = hostWidth;
        restoreAnchor();
        slotEl.style.transition = `width ${MOVE_MS.wide}ms ${MOVE_EASE.emphasized} ${MOVE_MS.edgeDelay}ms`;
      }
      phase.current = 'enter';
      slotEl.style.width = slotWidth;
      settleLater(MOVE_MS.edgeDelay + MOVE_MS.wide + MOVE_MS.settleSlack);
    } else if (kind === 'exit') {
      useChatPanel.getState().setMoving('exit');
      captureAnchor();
      phase.current = 'exit';
      slotEl.style.transition = `width ${MOVE_MS.back}ms ${MOVE_EASE.standard}`;
      slotEl.style.width = slotWidth;
      settleLater(MOVE_MS.back + MOVE_MS.settleSlack);
    } else if (phase.current !== 'idle') {
      slotEl.style.width = slotWidth;
      if (phase.current === 'enter') hostEl.style.width = hostWidth;
    } else {
      slotEl.style.transition = '';
      slotEl.style.width = slotWidth;
      hostEl.style.width = hostWidth;
    }

    const onEnd = (event: TransitionEvent) => {
      if (event.target !== slotEl || event.propertyName !== 'width') return;
      if (phase.current !== 'idle') settle();
    };
    slotEl.addEventListener('transitionend', onEnd);
    return () => slotEl.removeEventListener('transitionend', onEnd);
  }, [slot, host, enabled, chatWidth, slotWidth, hostWidth, resizing]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (phase.current !== 'idle') useChatPanel.getState().setMoving(null);
    },
    [],
  );
}

export function ChatChromeHost() {
  const mounted = useChatPanel((s) => s.chatMounted);
  return (
    <>
      <ChatRouterBinding />
      <FollowAlongController />
      <ChatLastPageTracker />
      {mounted &&
        createPortal(
          <ChatChrome
            onDragStart={(event) => dragStartHandler.current?.(event)}
          />,
          chatDom.root(),
        )}
    </>
  );
}

function ChatRouterBinding() {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const fullPage = useShellHandle().chat === 'full';
  const latest = useRef({ location, fullPage });
  latest.current = { location, fullPage };
  const seenKey = useRef<string | null>(location.key);

  useEffect(
    () =>
      chatPanelUtils.bindRouter({
        navigate: (target) => {
          if ('back' in target) {
            navigate(-1);
            return;
          }
          navigate(target.to, { replace: target.replace, state: target.state });
        },
        location: () => latest.current.location,
        isFullPage: () => latest.current.fullPage,
        captureAnchor,
      }),
    [navigate],
  );

  useEffect(() => {
    const panel = useChatPanel.getState();
    if (fullPage) {
      seenKey.current = null;
      panel.leaveSplit();
      return;
    }
    if (seenKey.current === location.key) return;
    seenKey.current = location.key;
    if (
      navigationType === 'POP' &&
      !panel.split &&
      isObject(location.state) &&
      location.state.chatSplit === true &&
      window.innerWidth >= chatLayoutUtils.MOBILE_BREAKPOINT
    ) {
      panel.enterSplit();
    }
  }, [fullPage, location.key, location.state, navigationType]);

  return null;
}

export function ChatWindow() {
  const chatWidth = useChatWidth();
  const full = chatWidth === 'full';
  const viewport = windowSizeHooks.useSize();
  const {
    open,
    float,
    floatSize,
    gesture,
    setOpen,
    mountChat,
    hasConversation,
  } = useChatPanel(
    useShallow((s) => ({
      hasConversation: s.conversationId !== null,
      open: s.open,
      float: s.float,
      floatSize: s.floatSize,
      gesture: s.gesture,
      setOpen: s.setOpen,
      mountChat: s.mountChat,
    })),
  );
  const [snap, setSnap] = useState<SnapCue | null>(null);
  const [gripActive, setGripActive] = useState(false);
  const chatEnabled =
    platformHooks.useCurrentPlatform().platform.plan.chatEnabled;
  const [card] = useState(() =>
    createCardMotion(chatLayoutUtils.FLOAT_DEFAULT),
  );
  const [sheetY] = useState(() => motionValue(0));
  const scrimOpacity = useTransform(sheetY, (y) =>
    chatLayoutUtils.clamp({
      value: 1 - y / window.innerHeight,
      min: 0,
      max: 1,
    }),
  );
  const docked = chatWidth === 'left' || chatWidth === 'right';
  const floating = chatWidth === 'float' || (docked && gesture !== 'idle');
  const sheetOpen = chatWidth === 'sheet';
  const fullRef = useRef(full);
  const floatHost = useChatHost(floating);
  const sheetHost = useChatHost(sheetOpen);

  useEffect(() => {
    fullRef.current = full;
    if (open || full) {
      mountChat();
      return;
    }
    const prewarm = setTimeout(mountChat, 800);
    return () => clearTimeout(prewarm);
  }, [open, full, mountChat]);

  useLayoutEffect(() => {
    if (gesture !== 'idle') {
      return;
    }
    const size = chatLayoutUtils.fitToWindow(
      floatSize ?? chatLayoutUtils.FLOAT_DEFAULT,
    );
    card.place({
      ...chatLayoutUtils.clampToWindow({
        position: float ?? chatLayoutUtils.defaultFloat(size),
        size,
      }),
      ...size,
    });
  }, [float, floatSize, gesture, viewport, card]);

  useFocusHandoff(chatWidth !== 'closed');
  useSheetHistory(sheetOpen);
  const sheetPill =
    viewport.width < chatLayoutUtils.MOBILE_BREAKPOINT &&
    chatWidth === 'closed' &&
    hasConversation;

  useEffect(() => {
    const size = chatLayoutUtils.fitToWindow(
      floatSize ?? chatLayoutUtils.FLOAT_DEFAULT,
    );
    const place = float ?? chatLayoutUtils.defaultFloat(size);
    useToastPlacement.setState(
      toastPlacementFor({
        chatWidth,
        floatCenterX: place.x + size.width / 2,
        viewportWidth: viewport.width,
      }),
    );
  }, [chatWidth, float, floatSize, viewport]);

  useEffect(() => {
    return useChatPanel.subscribe((state, prev) => {
      if (
        !state.open ||
        !prev.open ||
        state.gesture !== 'idle' ||
        state.mode === prev.mode ||
        fullRef.current
      ) {
        return;
      }
      const viewportWidth = window.innerWidth;
      const from = chatLayoutUtils.layoutFor({
        mode: prev.mode,
        viewportWidth,
      });
      const to = chatLayoutUtils.layoutFor({ mode: state.mode, viewportWidth });
      if (from === 'float' && (to === 'left' || to === 'right')) {
        const target = dockRect({ side: to, railOpen: railOpenNow() });
        if (target) {
          state.setGesture('settling');
          card.settle(target, () => state.setGesture('idle'));
        }
      } else if ((from === 'left' || from === 'right') && to === 'float') {
        const size = chatLayoutUtils.fitToWindow(
          state.floatSize ?? chatLayoutUtils.FLOAT_DEFAULT,
        );
        card.place(rectOf(chatDom.root()));
        state.setGesture('settling');
        card.settle(
          {
            ...chatLayoutUtils.clampToWindow({
              position: state.float ?? chatLayoutUtils.defaultFloat(size),
              size,
            }),
            ...size,
          },
          () => state.setGesture('idle'),
        );
      }
    });
  }, [card]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const focusInChat = chatDom.root().contains(document.activeElement);
      if (
        chatEnabled &&
        mod &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === 'j'
      ) {
        event.preventDefault();
        const panelOpen = useChatPanel.getState().open;
        if (full || (panelOpen && !focusInChat)) {
          chatDom.composer()?.focus();
        } else {
          setOpen(!panelOpen);
        }
        return;
      }
      if (
        !full &&
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        useChatPanel.getState().open &&
        focusInChat &&
        !hasText(document.activeElement) &&
        !hasText(chatDom.composer()) &&
        !document.querySelector(OPEN_LAYER_SELECTOR)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [full, chatEnabled, setOpen]);

  const startDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const target = event.target;
      const state = useChatPanel.getState();
      const layoutNow = chatLayoutUtils.layoutFor({
        mode: state.mode,
        viewportWidth: window.innerWidth,
      });
      if (
        !(target instanceof Element) ||
        event.button !== 0 ||
        !event.currentTarget.contains(target) ||
        target.closest('button, a, input, textarea, [role^="menuitem"]')
      ) {
        return;
      }
      event.preventDefault();
      if (layoutNow === 'sheet') {
        swipeSheet({ event, sheetY });
        return;
      }
      const fromDock = layoutNow !== 'float' && state.gesture === 'idle';
      const from = fromDock ? rectOf(chatDom.root()) : card.rect();
      const origin = state.mode;
      const start = { x: event.clientX, y: event.clientY };
      const grab = {
        ratioX: (start.x - from.x) / from.width,
        y: start.y - from.y,
      };
      const floatTarget = chatLayoutUtils.fitToWindow(
        state.floatSize ?? chatLayoutUtils.FLOAT_DEFAULT,
      );
      const unlock = lockPointer('grabbing');
      let pointer = start;
      let moved = false;
      let stopFollow: (() => void) | null = null;
      let geometry = snapGeometry();
      let zone: SnapTarget | null = null;
      let armed = false;
      let alt = event.altKey;
      const showCue = () =>
        setSnap(armed && zone ? cueFor({ target: zone, geometry }) : null);
      const updateSnap = () => {
        const left = pointer.x - grab.ratioX * floatTarget.width;
        const next = alt
          ? null
          : snapTarget({
              at: {
                left,
                right: left + floatTarget.width,
                pointerX: pointer.x,
              },
              geometry,
              current: zone,
            });
        if (next !== zone) {
          zone = next;
          armed = zone !== null;
          showCue();
        }
      };

      const follow = () => {
        const size = { width: card.width.get(), height: card.height.get() };
        const position = chatLayoutUtils.clampToWindow({
          position: {
            x: pointer.x - grab.ratioX * size.width,
            y: pointer.y - grab.y,
          },
          size,
        });
        card.x.set(position.x);
        card.y.set(position.y);
      };

      const lift = () => {
        moved = true;
        card.place(from);
        card.resize(floatTarget);
        stopFollow = card.width.on('change', follow);
        chatLayoutUtils.startStructuralMove('exit');
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

      const settleIntoDock = ({
        dockSide,
        redock,
      }: {
        dockSide: ChatPanelSide;
        redock: boolean;
      }) => {
        const panel = useChatPanel.getState();
        if (redock) {
          panel.dock(dockSide);
        }
        const rect = dockRect({ side: dockSide, railOpen: railOpenNow() });
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
        const side = armed && zone !== 'narrow' ? zone : null;
        finish();
        if (!moved) {
          return;
        }
        if (side) {
          settleIntoDock({ dockSide: side, redock: true });
          return;
        }
        const size = floatTarget;
        settleFloating({
          ...chatLayoutUtils.clampToWindow({
            position: {
              x: pointer.x - grab.ratioX * size.width,
              y: pointer.y - grab.y,
            },
            size,
          }),
          ...size,
        });
      };

      const onCancel = () => {
        finish();
        if (!moved) {
          return;
        }
        if (
          origin !== 'float' &&
          chatLayoutUtils.layoutFor({
            mode: origin,
            viewportWidth: window.innerWidth,
          }) === origin
        ) {
          settleIntoDock({ dockSide: origin, redock: false });
        } else {
          settleFloating(from);
        }
      };
      const onKey = (key: KeyboardEvent) => {
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
          chatLayoutUtils.clamp({
            value: from.width + move.clientX - start.x,
            min: chatLayoutUtils.FLOAT_MIN.width,
            max: window.innerWidth - from.x - chatLayoutUtils.EDGE,
          }),
        );
        card.height.set(
          chatLayoutUtils.clamp({
            value: from.height + move.clientY - start.y,
            min: chatLayoutUtils.FLOAT_MIN.height,
            max: window.innerHeight - from.y - chatLayoutUtils.EDGE,
          }),
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
      {ChatDemoCorner && (
        <Suspense fallback={null}>
          <ChatDemoCorner />
        </Suspense>
      )}
      <ChatAnnouncer />
      {sheetPill && <ChatSheetPill />}
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
            initial={gesture === 'idle' ? 'hidden' : false}
            animate="shown"
            exit="hidden"
            className={cn(
              'group/float fixed top-0 left-0 z-40 overflow-hidden rounded-xl border bg-gray-1 transition-shadow duration-150 ease-move',
              gesture !== 'idle' && 'will-change-transform',
              gesture === 'dragging'
                ? 'shadow-over'
                : (gesture === 'idle' || chatWidth === 'float') &&
                    'shadow-lift',
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
          <motion.div
            key="chat-sheet-scrim"
            aria-hidden
            className="fixed inset-0 z-40"
            style={{ opacity: scrimOpacity }}
          >
            <motion.div
              className="absolute inset-0 bg-scrim"
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

function swipeSheet({
  event,
  sheetY,
}: {
  event: React.PointerEvent<HTMLElement>;
  sheetY: ReturnType<typeof motionValue<number>>;
}) {
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

function ChatAnnouncer() {
  const announcement = useChatPanel((s) => s.announcement);
  return (
    <div aria-live="polite" role="status" className="sr-only">
      {announcement && <span key={announcement.id}>{announcement.text}</span>}
    </div>
  );
}

function ChatSheetPill() {
  const needsYou = useChatPanel((s) => s.gateOpen);
  const conversationId = useChatPanel((s) => s.conversationId);
  const line = useConversationChanges(conversationId).at(-1);
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={CUE_MOTION}
      onClick={() => useChatPanel.getState().setOpen(true)}
      aria-label={needsYou ? t('Open chat, it needs you') : t('Open chat')}
      className="fixed left-1/2 z-40 flex h-11 max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full border bg-gray-1 pr-4 pl-3 text-sm text-gray-12 shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-8"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
    >
      <span className="relative flex size-6 shrink-0 items-center justify-center">
        <ChatSparkIcon className="size-5" />
        {needsYou && (
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-gray-1 bg-accent-9"
          />
        )}
      </span>
      <span className="truncate">
        {line ? <ChangeLineText line={line} /> : t('Chat')}
      </span>
    </motion.button>
  );
}

function ChangeLineText({ line }: { line: ChangeLine }) {
  const name =
    useResourceName(line.ref) ?? resourceRegistry.kindInfo(line.ref.kind).label;
  return describeChange({ line, name });
}

function useSheetHistory(sheetOpen: boolean) {
  const navigate = useNavigate();
  const location = useLocation();
  const wasOpen = useRef(sheetOpen);
  const lastHash = useRef(location.hash);

  useEffect(() => {
    const opened = sheetOpen && !wasOpen.current;
    const closed = !sheetOpen && wasOpen.current;
    const hashLeft =
      lastHash.current === chatPanelUtils.MOBILE_SHEET_HASH &&
      location.hash !== chatPanelUtils.MOBILE_SHEET_HASH;
    wasOpen.current = sheetOpen;
    lastHash.current = location.hash;
    if (closed) captureAnchor();
    if (opened && location.hash !== chatPanelUtils.MOBILE_SHEET_HASH) {
      navigate(
        `${location.pathname}${location.search}${chatPanelUtils.MOBILE_SHEET_HASH}`,
        { state: location.state },
      );
      return;
    }
    if (sheetOpen && hashLeft) {
      useChatPanel.getState().setOpen(false);
      return;
    }
    if (closed && location.hash === chatPanelUtils.MOBILE_SHEET_HASH) {
      navigate(-1);
    }
  }, [sheetOpen, location, navigate]);
}

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
      let frame = 0;
      let tries = 0;
      const focusInput = () => {
        const input = chatDom.composer();
        if (input && chatDom.root().isConnected) {
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
      !active || active === document.body || chatDom.root().contains(active);
    if (focusLeftWithPanel && returnTo.current?.isConnected) {
      returnTo.current.focus({ preventScroll: true });
    }
    returnTo.current = null;
  }, [open]);
}

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
  const motionFor = () =>
    chatLayoutUtils.prefersReducedMotion() ? { duration: 0 } : SETTLE;

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
      Promise.all(
        running.map(
          (controls) => new Promise<void>((resolve) => controls.then(resolve)),
        ),
      )
        .then(finish)
        .catch(() => undefined);
    },
  };
}

function captureAnchor() {
  const scroller = chatDom.scroller();
  if (!scroller || !scroller.isConnected) return;
  const gap =
    scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
  if (gap <= PINNED_GAP) {
    anchor = { pinned: true };
    return;
  }
  const top = scroller.getBoundingClientRect().top;
  const element = firstElementFrom({ scroller, top });
  anchor = element
    ? {
        pinned: false,
        element,
        offset: element.getBoundingClientRect().top - top,
      }
    : null;
}

function firstElementFrom({
  scroller,
  top,
}: {
  scroller: HTMLElement;
  top: number;
}): Element | null {
  const walker = document.createTreeWalker(scroller, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      if (!(node instanceof Element)) return NodeFilter.FILTER_SKIP;
      const rect = node.getBoundingClientRect();
      if (rect.bottom <= top) return NodeFilter.FILTER_REJECT;
      return rect.height > 0 && rect.top >= top - ANCHOR_STRADDLE
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP;
    },
  });
  const first = walker.nextNode();
  if (!(first instanceof Element)) return null;
  let element = first;
  const startsWith = (child: Element) =>
    Math.abs(
      child.getBoundingClientRect().top - element.getBoundingClientRect().top,
    ) < 1 && child.getBoundingClientRect().height > 0;
  let child = Array.from(element.children).find(startsWith);
  while (child) {
    element = child;
    child = Array.from(element.children).find(startsWith);
  }
  return element;
}

function restoreAnchor() {
  applyAnchor();
  holdAnchor();
}

function applyAnchor() {
  const saved = anchor;
  const scroller = chatDom.scroller();
  if (!saved || !scroller) return;
  if (saved.pinned) {
    scroller.scrollTop = scroller.scrollHeight;
    return;
  }
  if (!saved.element.isConnected) return;
  const top = scroller.getBoundingClientRect().top;
  scroller.scrollTop +=
    saved.element.getBoundingClientRect().top - top - saved.offset;
}

function holdAnchor() {
  releaseAnchor?.();
  const scroller = chatDom.scroller();
  const content = scroller?.firstElementChild;
  if (!anchor || !scroller || !content) return;
  const observer = new ResizeObserver(() => requestAnimationFrame(applyAnchor));
  observer.observe(content);
  observer.observe(scroller);
  const release = () => {
    observer.disconnect();
    clearTimeout(timer);
    USER_SCROLL_EVENTS.forEach((type) =>
      scroller.removeEventListener(type, release),
    );
    if (releaseAnchor === release) releaseAnchor = null;
  };
  const timer = setTimeout(release, ANCHOR_HOLD_MS);
  USER_SCROLL_EVENTS.forEach((type) =>
    scroller.addEventListener(type, release, { passive: true }),
  );
  releaseAnchor = release;
}

function dipIn() {
  dip?.cancel();
  dip =
    chatDom
      .root()
      .querySelector('[data-chat-box]')
      ?.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: DIP_MS,
        easing: 'ease-out',
      }) ?? null;
}

function rewrap(apply: () => void) {
  apply();
  restoreAnchor();
  dipIn();
}

function useChatHost(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = chatDom.root();
    if (!active || !ref.current || node.parentElement === ref.current) {
      return;
    }
    if (node.isConnected) captureAnchor();
    ref.current.appendChild(node);
    restoreAnchor();
  }, [active]);
  return ref;
}

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

function hasText(element: Element | null): boolean {
  return (
    (element instanceof HTMLTextAreaElement ||
      element instanceof HTMLInputElement) &&
    element.value.trim().length > 0
  );
}

function dockRect({
  side,
  railOpen,
}: {
  side: ChatPanelSide;
  railOpen: boolean;
}): Rect | null {
  const card = chatLayoutUtils.cardRect();
  return card ? dockRectIn({ card, side, railOpen }) : null;
}

function dockRectIn({
  card,
  side,
  railOpen,
}: {
  card: CardSpan;
  side: ChatPanelSide;
  railOpen: boolean;
}): Rect {
  const viewportWidth = window.innerWidth;
  const width = chatLayoutUtils.dockWidthFor({
    savedWidth: useChatPanel.getState().dockWidth,
    cardWidth: chatLayoutUtils.cardInnerWidth({ viewportWidth, railOpen }),
  });
  return {
    x:
      side === 'left'
        ? chatLayoutUtils.sidebarWidth(railOpen) + 1
        : viewportWidth - GUTTER_RIGHT - 1 - width,
    y: card.top + 1,
    width,
    height: card.height - 2,
  };
}

function snapGeometry(): SnapGeometry {
  const viewport = window.innerWidth;
  const card = chatLayoutUtils.cardRect();
  return {
    viewport,
    dockable: viewport >= chatLayoutUtils.DOCK_BREAKPOINT,
    leftEdge: chatLayoutUtils.sidebarWidth(railOpenNow()),
    rightEdge: viewport - GUTTER_RIGHT,
    previews: card
      ? {
          left: dockRectIn({ card, side: 'left', railOpen: false }),
          right: dockRectIn({ card, side: 'right', railOpen: false }),
        }
      : null,
  };
}

function snapTarget({
  at,
  geometry,
  current,
}: {
  at: { left: number; right: number; pointerX: number };
  geometry: SnapGeometry;
  current: SnapTarget | null;
}): SnapTarget | null {
  const hold = (target: SnapTarget) => (target === current ? SNAP_HOLD : 0);
  if (!geometry.dockable) {
    if (geometry.viewport < chatLayoutUtils.MOBILE_BREAKPOINT) {
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

function cueFor({
  target,
  geometry,
}: {
  target: SnapTarget;
  geometry: SnapGeometry;
}): SnapCue | null {
  if (target === 'narrow') {
    return { kind: 'narrow' };
  }
  const rect = geometry.previews?.[target];
  return rect ? { kind: 'dock', side: target, rect } : null;
}

function toastPlacementFor({
  chatWidth,
  floatCenterX,
  viewportWidth,
}: {
  chatWidth: ChatWidth;
  floatCenterX: number;
  viewportWidth: number;
}): ToastPlacement {
  const position = toastPositionFor({ chatWidth, floatCenterX, viewportWidth });
  return {
    position,
    offset:
      position === 'bottom-center' ? { bottom: COMPOSER_CLEARANCE } : undefined,
  };
}

function toastPositionFor({
  chatWidth,
  floatCenterX,
  viewportWidth,
}: {
  chatWidth: ChatWidth;
  floatCenterX: number;
  viewportWidth: number;
}): ToastPosition {
  switch (chatWidth) {
    case 'full':
      return 'bottom-center';
    case 'sheet':
      return 'top-center';
    case 'right':
      return 'bottom-left';
    case 'float':
      return floatCenterX > viewportWidth / 2 ? 'bottom-left' : 'bottom-right';
    default:
      return 'bottom-right';
  }
}

function rectOf(element: HTMLElement): Rect {
  const rect = element.getBoundingClientRect();
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
}

const SNAP_REACH = 48;
const SNAP_HOLD = 24;
const POINTER_EDGE = 24;
const EDGE_PUSH = 24;
const DRAG_THRESHOLD = 4;
const SHEET_DISMISS_SHARE = 0.25;
const SHEET_DISMISS_VELOCITY = 0.5;
const EASE_OUT = chatLayoutUtils.MOVE_EASE.out;
const CUE_MOTION = { duration: 0.12, ease: EASE_OUT };
const SETTLE = { type: 'spring', bounce: 0, visualDuration: 0.25 } as const;
const COMPOSER_CLEARANCE = 144;
const OPEN_LAYER_SELECTOR =
  '[role="dialog"], [role="menu"], [role="listbox"], [data-radix-popper-content-wrapper]';
const GUTTER_RIGHT = 8;
const DIP_MS = 120;
const PINNED_GAP = 24;
const ANCHOR_HOLD_MS = 700;
const USER_SCROLL_EVENTS: Array<'wheel' | 'touchstart' | 'keydown'> = [
  'wheel',
  'touchstart',
  'keydown',
];
const ANCHOR_STRADDLE = 8;

const { MOVE_MS, MOVE_EASE } = chatLayoutUtils;
const ChatDemoCorner = import.meta.env.DEV
  ? lazy(() =>
      import('./chat-demo-corner').then((module) => ({
        default: module.ChatDemoCorner,
      })),
    )
  : null;
const useToastPlacement = create<ToastPlacement>(() => ({
  position: 'bottom-right',
  offset: undefined,
}));
const floatCard = {
  hidden: (stillOpen: boolean) =>
    stillOpen
      ? { opacity: 0, transition: { duration: 0 } }
      : chatLayoutUtils.prefersReducedMotion()
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
      duration: chatLayoutUtils.prefersReducedMotion() ? 0.1 : 0.18,
      ease: EASE_OUT,
    },
  }),
};

const sheetVariants = {
  hidden: () =>
    chatLayoutUtils.prefersReducedMotion()
      ? { opacity: 0, transition: { duration: 0.1 } }
      : {
          y: window.innerHeight,
          transition: { duration: 0.2, ease: EASE_OUT },
        },
  shown: () =>
    chatLayoutUtils.prefersReducedMotion()
      ? { opacity: 1, y: 0, transition: { duration: 0.1 } }
      : { y: 0, opacity: 1, transition: { duration: 0.28, ease: EASE_OUT } },
};

const dragStartHandler: {
  current: ((event: React.PointerEvent<HTMLElement>) => void) | null;
} = { current: null };
let anchor: ChatAnchor | null = null;
let dip: Animation | null = null;
let releaseAnchor: (() => void) | null = null;

type Rect = FloatPosition & FloatSize;
type MovePhase = 'idle' | 'enter' | 'exit';
type ChatAnchor =
  | { pinned: true }
  | { pinned: false; element: Element; offset: number };
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
type ToastPosition = NonNullable<ToasterProps['position']>;
type ToastPlacement = {
  position: ToastPosition;
  offset: ToasterProps['offset'];
};
