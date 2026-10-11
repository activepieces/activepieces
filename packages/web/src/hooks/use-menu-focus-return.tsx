import {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';

import { toastInteraction } from '@/lib/toast-interaction';

let lastMenuSelection: HTMLElement | null = null;

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
  lastMenuSelection = trigger;
  requestAnimationFrame(() => {
    if (lastMenuSelection === trigger) {
      lastMenuSelection = null;
    }
  });
}

function takeMenuTrigger(): HTMLElement | null {
  const active = document.activeElement;
  const fromFocus = active ? resolveMenuTrigger(active) : null;
  const selection = lastMenuSelection;
  lastMenuSelection = null;
  return fromFocus ?? selection;
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

function MenuFocusReturnScope({ children }: { children: ReactNode }) {
  return (
    <MenuFocusReturnContext.Provider value={true}>
      {children}
    </MenuFocusReturnContext.Provider>
  );
}

function useMenuSelectionMemory() {
  const enabled = useContext(MenuFocusReturnContext);
  return (event: Event) => {
    if (enabled) {
      rememberMenuSelection(event);
    }
  };
}

function useMenuFocusReturn<E extends Event>({
  onCloseAutoFocus,
  onInteractOutside,
}: UseMenuFocusReturnParams<E>) {
  const enabled = useContext(MenuFocusReturnContext);
  const triggerRef = useRef<HTMLElement | null>(null);
  if (!enabled) {
    return { capture: null, onCloseAutoFocus, onInteractOutside };
  }
  return {
    capture: <MenuTriggerCapture triggerRef={triggerRef} />,
    onInteractOutside: toastInteraction.ignore(onInteractOutside),
    onCloseAutoFocus: (event: Event) => {
      onCloseAutoFocus?.(event);
      const trigger = triggerRef.current;
      triggerRef.current = null;
      if (
        event.defaultPrevented ||
        !trigger?.isConnected ||
        trigger.matches(':disabled')
      ) {
        return;
      }
      event.preventDefault();
      trigger.focus();
    },
  };
}

const MenuFocusReturnContext = createContext(false);

export { MenuFocusReturnScope, useMenuFocusReturn, useMenuSelectionMemory };

type MenuTriggerCaptureProps = {
  triggerRef: RefObject<HTMLElement | null>;
};

export type UseMenuFocusReturnParams<E extends Event> = {
  onCloseAutoFocus?: (event: Event) => void;
  onInteractOutside?: (event: E) => void;
};
