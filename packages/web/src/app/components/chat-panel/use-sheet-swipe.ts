import { animate, Transition, useMotionValue } from 'motion/react';
import { RefObject, useCallback, useEffect, useRef } from 'react';

import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';

export function useSheetSwipe({
  enabled,
  panelRef,
  scrimRef,
  onDismiss,
}: {
  enabled: boolean;
  panelRef: RefObject<HTMLElement | null>;
  scrimRef: RefObject<HTMLElement | null>;
  onDismiss: () => void;
}) {
  const sheetY = useMotionValue(0);
  const height = useRef(1);
  const active = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const stopGesture = useRef<(() => void) | null>(null);

  useEffect(
    () =>
      sheetY.on('change', (y) => {
        const panel = panelRef.current;
        const scrim = scrimRef.current;
        if (!active.current) return;
        if (panel) {
          panel.style.transition = 'none';
          panel.style.translate = `0 ${y}px`;
        }
        if (scrim) {
          scrim.style.transition = 'none';
          scrim.style.opacity = String(
            1 - Math.min(1, Math.max(0, y) / height.current),
          );
        }
      }),
    [sheetY, panelRef, scrimRef],
  );

  const release = useCallback(() => {
    active.current = false;
    sheetY.jump(0);
    for (const element of [panelRef.current, scrimRef.current]) {
      element?.style.removeProperty('transition');
      element?.style.removeProperty('translate');
      element?.style.removeProperty('opacity');
    }
  }, [sheetY, panelRef, scrimRef]);

  useEffect(() => {
    if (enabled) return;
    stopGesture.current?.();
    sheetY.stop();
    release();
  }, [enabled, release, sheetY]);

  useEffect(
    () => () => {
      stopGesture.current?.();
      sheetY.stop();
    },
    [sheetY],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const panel = panelRef.current;
      const target = event.target;
      if (
        !enabled ||
        !panel ||
        event.button !== 0 ||
        !(target instanceof Element) ||
        target.closest(INTERACTIVE)
      ) {
        return;
      }
      const scroller = scrollableAncestor({ from: target, within: panel });
      const startY = event.clientY;
      const base = sheetY.get();
      let samples: Sample[] = [{ y: startY, time: event.timeStamp }];
      let claimed = false;
      let restoreSelect: (() => void) | null = null;

      const stop = () => {
        stopGesture.current = null;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        window.removeEventListener('touchmove', holdTouch);
        restoreSelect?.();
      };
      const onMove = (move: PointerEvent) => {
        if (move.pointerId !== event.pointerId) return;
        const delta = move.clientY - startY;
        if (!claimed) {
          if (Math.abs(delta) < DRAG_THRESHOLD) return;
          const listCanScroll =
            scroller !== null && (delta < 0 || scroller.scrollTop > 0);
          if (listCanScroll) {
            stop();
            return;
          }
          claimed = true;
          active.current = true;
          height.current = panel.getBoundingClientRect().height || 1;
          sheetY.stop();
          restoreSelect = blockTextSelection();
        }
        const offset = base + delta;
        sheetY.set(offset >= 0 ? offset : -Math.sqrt(-offset) * 2);
        samples = [
          ...samples.filter(
            (sample) => move.timeStamp - sample.time <= VELOCITY_WINDOW_MS,
          ),
          { y: move.clientY, time: move.timeStamp },
        ];
      };
      const holdTouch = (touch: TouchEvent) => {
        if (claimed && touch.cancelable) touch.preventDefault();
      };
      const settle = (dismiss: boolean) => {
        stop();
        if (!claimed) return;
        if (!dismiss) {
          animate(sheetY, 0, settleTransition())
            .then(() => {
              if (sheetY.get() === 0) release();
            })
            .catch(() => undefined);
          return;
        }
        animate(sheetY, height.current, settleTransition())
          .then(() => {
            if (enabledRef.current) onDismiss();
          })
          .catch(() => undefined);
      };
      const onUp = (up: PointerEvent) => {
        if (up.pointerId !== event.pointerId) return;
        settle(
          sheetY.get() > height.current * SHEET_DISMISS_SHARE ||
            velocityOf([...samples, { y: up.clientY, time: up.timeStamp }]) >
              SHEET_DISMISS_VELOCITY,
        );
      };
      const onCancel = (cancel: PointerEvent) => {
        if (cancel.pointerId === event.pointerId) settle(false);
      };
      stopGesture.current = stop;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      window.addEventListener('touchmove', holdTouch, { passive: false });
    },
    [enabled, panelRef, sheetY, release, onDismiss],
  );

  return { onPointerDown };
}

function velocityOf(samples: Sample[]): number {
  const first = samples[0];
  const last = samples[samples.length - 1];
  const elapsed = last.time - first.time;
  return elapsed > 0 ? (last.y - first.y) / elapsed : 0;
}

function scrollableAncestor({
  from,
  within,
}: {
  from: Element;
  within: Element;
}): HTMLElement | null {
  for (
    let node: Element | null = from;
    node && node !== within;
    node = node.parentElement
  ) {
    if (!(node instanceof HTMLElement)) continue;
    const { overflowY } = getComputedStyle(node);
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
  }
  return null;
}

function blockTextSelection(): () => void {
  window.getSelection()?.removeAllRanges();
  const previous = document.body.style.userSelect;
  document.body.style.userSelect = 'none';
  return () => {
    document.body.style.userSelect = previous;
  };
}

const INTERACTIVE =
  'button, a, input, textarea, select, [contenteditable="true"], [role^="menuitem"], [role="slider"], [data-no-sheet-swipe]';
const DRAG_THRESHOLD = 4;
const SHEET_DISMISS_SHARE = 0.25;
const SHEET_DISMISS_VELOCITY = 0.11;
const VELOCITY_WINDOW_MS = 100;

function settleTransition(): Transition {
  return chatLayoutUtils.prefersReducedMotion()
    ? { duration: 0 }
    : { type: 'spring', bounce: 0, visualDuration: 0.25 };
}

type Sample = { y: number; time: number };
