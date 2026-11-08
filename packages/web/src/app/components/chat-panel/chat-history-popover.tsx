import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { useLayoutEffect, useState } from 'react';

import { chatDom } from './chat-dom';
import { historyMotion } from './chat-history-motion';

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
    const composerTop = composerBlock()?.getBoundingClientRect().top;
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
            onPointerDown={(event) => event.stopPropagation()}
            onInteractOutside={(event) => {
              const target = event.target;
              if (
                target instanceof Node &&
                triggerRef.current?.contains(target)
              ) {
                event.preventDefault();
              }
            }}
            onEscapeKeyDown={(event) => {
              const target = event.target;
              if (target instanceof HTMLInputElement && target.value) {
                event.preventDefault();
                return;
              }
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

function composerBlock(): HTMLElement | null {
  const panel = chatDom.root();
  let node = chatDom.composer();
  while (
    node?.parentElement &&
    node.parentElement !== panel &&
    node.parentElement.getBoundingClientRect().height < COMPOSER_MAX_HEIGHT
  ) {
    node = node.parentElement;
  }
  return node;
}

const INSET = 8;
const SIDE_OFFSET = -4;
const MAX_HEIGHT = 480;
const MIN_HEIGHT = 240;
const COMPOSER_GAP = 8;
const COMPOSER_MAX_HEIGHT = 220;
