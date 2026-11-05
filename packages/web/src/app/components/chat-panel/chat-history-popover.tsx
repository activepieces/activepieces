import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { useLayoutEffect, useState } from 'react';

import { historyMotion } from './chat-history-motion';

// The floating card's history: a dropdown hung from the header, as wide as the
// card allows, growing out of the History button.
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
  const [geometry, setGeometry] = useState({ width: 320, originX: 0 });

  useLayoutEffect(() => {
    const header = headerRef.current?.getBoundingClientRect();
    const trigger = triggerRef.current?.getBoundingClientRect();
    if (!open || !header || !trigger) return;
    setGeometry({
      width: header.width - INSET * 2,
      originX: trigger.left + trigger.width / 2 - header.left - INSET,
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
            sideOffset={-4}
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
              onEscape();
            }}
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            <motion.div
              style={{
                width: geometry.width,
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
              className="z-50 flex max-h-[min(480px,var(--radix-popover-content-available-height))] flex-col overflow-hidden rounded-xl border bg-panel pt-3 shadow-lg outline-hidden"
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
