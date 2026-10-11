import { RefObject, useLayoutEffect, useRef } from 'react';

let lastMenuSelection: MenuSelection | null = null;

function resolveMenuTrigger(element: Element): HTMLElement | null {
  let trigger: HTMLElement | null = null;
  let menu = element.closest('[role="menu"]');
  while (menu) {
    const triggerId = menu.getAttribute('aria-labelledby');
    const next = triggerId ? document.getElementById(triggerId) : null;
    if (!next) {
      break;
    }
    trigger = next;
    menu = next.closest('[role="menu"]');
  }
  return trigger;
}

function rememberMenuSelection(event: Event): void {
  if (!(event.target instanceof Element)) {
    return;
  }
  const trigger = resolveMenuTrigger(event.target);
  lastMenuSelection = trigger ? { trigger, at: Date.now() } : null;
}

function takeMenuTrigger(): HTMLElement | null {
  const active = document.activeElement;
  const fromFocus = active ? resolveMenuTrigger(active) : null;
  const selection = lastMenuSelection;
  lastMenuSelection = null;
  if (fromFocus) {
    return fromFocus;
  }
  const isRecent =
    selection !== null && Date.now() - selection.at < SELECTION_WINDOW_MS;
  return isRecent ? selection.trigger : null;
}

function focusedBeforeOpen(): HTMLElement | null {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || active === document.body) {
    return null;
  }
  return active;
}

function MenuTriggerCapture({ triggerRef }: MenuTriggerCaptureProps) {
  useLayoutEffect(() => {
    triggerRef.current =
      takeMenuTrigger() ?? focusedBeforeOpen() ?? triggerRef.current;
  }, [triggerRef]);
  return null;
}

function useMenuFocusReturn({ onCloseAutoFocus }: UseMenuFocusReturnParams) {
  const triggerRef = useRef<HTMLElement | null>(null);
  return {
    capture: <MenuTriggerCapture triggerRef={triggerRef} />,
    onCloseAutoFocus: (event: Event) => {
      onCloseAutoFocus?.(event);
      const trigger = triggerRef.current;
      triggerRef.current = null;
      if (event.defaultPrevented || !trigger?.isConnected) {
        return;
      }
      event.preventDefault();
      trigger.focus();
    },
  };
}

const SELECTION_WINDOW_MS = 1000;

export const menuFocusReturn = {
  rememberSelection: rememberMenuSelection,
};

export { useMenuFocusReturn };

type MenuSelection = {
  trigger: HTMLElement;
  at: number;
};

type MenuTriggerCaptureProps = {
  triggerRef: RefObject<HTMLElement | null>;
};

export type UseMenuFocusReturnParams = {
  onCloseAutoFocus?: (event: Event) => void;
};
