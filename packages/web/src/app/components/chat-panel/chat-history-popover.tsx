import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { useLayoutEffect, useState } from 'react';

import { historyMotion } from './chat-history-motion';

// The floating card's history: a dropdown hung from the header, as wide as the
// card allows, growing out of the History button. It stops short of the chat's
// composer, so the input you were typing in stays in view; only a card too
// short to fit a useful list lets it overlap.
export function ChatHistoryPopover({
  open,
  headerRef,
  triggerRef,
  onEscape,
  children,
}: {
  open: boolean;
  headerRef: React.RefObject<HTMLElement | null>;
  triggerRef: React.RefObject<HTMLElement | null>;
  onEscape: () => void;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const [geometry, setGeometry] = useState({
    width: 320,
    originX: 0,
    maxHeight: MAX_HEIGHT,
  });

  useLayoutEffect(() => {
    const headerEl = headerRef.current;
    const header = headerEl?.getBoundingClientRect();
    const trigger = triggerRef.current?.getBoundingClientRect();
    if (!open || !headerEl || !header || !trigger) return;
    const composerTop = composerOf(headerEl)?.getBoundingClientRect().top;
    const room =
      composerTop === undefined
        ? MAX_HEIGHT
        : composerTop - header.bottom - SIDE_OFFSET - COMPOSER_GAP;
    setGeometry({
      width: header.width - INSET * 2,
      originX: trigger.left + trigger.width / 2 - header.left - INSET,
      maxHeight: Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, room)),
    });
  }, [open, headerRef, triggerRef]);

  return (
    <AnimatePresence>
      {open && (
        <PopoverPrimitive.Portal forceMount>
          <PopoverPrimitive.Content
            forceMount
            asChild
            side="bottom"
            align="center"
            sideOffset={SIDE_OFFSET}
            collisionPadding={INSET}
            // The content is a React child of the draggable header: keep a
            // press inside it from starting a drag.
            onPointerDown={(event) => event.stopPropagation()}
            onInteractOutside={(event) => {
              if (triggerRef.current?.contains(event.target as Node)) {
                event.preventDefault();
              }
            }}
            onEscapeKeyDown={(event) => {
              const target = event.target;
              if (target instanceof HTMLInputElement && target.value) {
                event.preventDefault();
                return;
              }
              // This Esc closes the dropdown and ends here: it must not also
              // close the panel.
              event.stopPropagation();
              onEscape();
            }}
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            <motion.div
              style={{
                width: geometry.width,
                maxHeight: `min(${geometry.maxHeight}px, var(--radix-popover-content-available-height))`,
                transformOrigin: `${geometry.originX}px 0px`,
              }}
              initial={{ opacity: 0, scale: reduced ? 1 : 0.98 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: historyMotion.popIn(reduced),
              }}
              exit={{
                opacity: 0,
                scale: reduced ? 1 : 0.98,
                transition: historyMotion.popOut(reduced),
              }}
              className="z-50 flex flex-col overflow-hidden rounded-xl border bg-panel pt-2 shadow-lg outline-hidden [--history-bg:var(--color-panel)]"
            >
              {children}
            </motion.div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      )}
    </AnimatePresence>
  );
}

const INSET = 8;
const SIDE_OFFSET = -4;
const MAX_HEIGHT = 480;
const MIN_HEIGHT = 240;
// Air between the dropdown's bottom edge and the composer's top.
const COMPOSER_GAP = 8;

// The block that holds the chat's input: the tallest short ancestor of its
// textarea, within the panel.
function composerOf(header: HTMLElement): HTMLElement | null {
  const panel = header.parentElement;
  let node: HTMLElement | null = panel?.querySelector('textarea') ?? null;
  while (
    node?.parentElement &&
    node.parentElement !== panel &&
    node.parentElement.getBoundingClientRect().height < COMPOSER_MAX_HEIGHT
  ) {
    node = node.parentElement;
  }
  return node;
}
const COMPOSER_MAX_HEIGHT = 220;
