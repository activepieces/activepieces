import { useCallback, useEffect, useRef, useState } from 'react';

// Shared open-state for header menus that open on hover as well as click.
// The menu never pins: however it was opened, it closes when the pointer
// leaves (with small delays that forgive a pointer just passing through).
// Clicking the trigger of an open menu is a no-op rather than a toggle-close,
// so dismissal stays hover-driven. Pair with a modal Popover so the rest of
// the page can't be hovered or clicked while the menu is open.
export function useHoverOpenPopover() {
  const [open, setOpen] = useState(false);
  const hoverOpenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hoverCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (hoverOpenTimeoutRef.current) {
        clearTimeout(hoverOpenTimeoutRef.current);
      }
      if (hoverCloseTimeoutRef.current) {
        clearTimeout(hoverCloseTimeoutRef.current);
      }
    };
  }, []);

  // While the menu is open nothing else on the page can be hovered or
  // clicked — the trigger and the popover content opt back in with a
  // `pointer-events-auto` class. An outside click only dismisses the menu,
  // it never reaches the element underneath.
  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.pointerEvents;
    document.body.style.pointerEvents = 'none';
    return () => {
      document.body.style.pointerEvents = previous;
    };
  }, [open]);

  const handleHoverEnter = useCallback(() => {
    if (hoverCloseTimeoutRef.current) {
      clearTimeout(hoverCloseTimeoutRef.current);
      hoverCloseTimeoutRef.current = null;
    }
    if (open || hoverOpenTimeoutRef.current) return;
    hoverOpenTimeoutRef.current = setTimeout(() => {
      hoverOpenTimeoutRef.current = null;
      setOpen(true);
    }, HOVER_OPEN_DELAY_MS);
  }, [open]);

  const handleHoverLeave = useCallback(() => {
    if (hoverOpenTimeoutRef.current) {
      clearTimeout(hoverOpenTimeoutRef.current);
      hoverOpenTimeoutRef.current = null;
    }
    if (!open || hoverCloseTimeoutRef.current) {
      return;
    }
    hoverCloseTimeoutRef.current = setTimeout(() => {
      hoverCloseTimeoutRef.current = null;
      setOpen(false);
    }, HOVER_CLOSE_DELAY_MS);
  }, [open]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
  }, []);

  // Radix toggles an open popover closed when its trigger is clicked; swallow
  // that so a click can only ever open the menu, never pin or close it.
  const keepOpenOnClick = useCallback(
    (event: React.MouseEvent) => {
      if (open) {
        event.preventDefault();
      }
    },
    [open],
  );

  const close = useCallback(() => setOpen(false), []);

  return {
    open,
    handleHoverEnter,
    handleHoverLeave,
    handleOpenChange,
    keepOpenOnClick,
    close,
  };
}

const HOVER_OPEN_DELAY_MS = 150;
const HOVER_CLOSE_DELAY_MS = 200;
