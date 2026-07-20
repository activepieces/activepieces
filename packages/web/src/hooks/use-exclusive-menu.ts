import { useEffect } from 'react';

/**
 * Coordinates menus that must never be open at the same time (e.g. the sidebar
 * platform switcher and the user menu). When one opens it announces itself,
 * and every other open menu listening on the same event closes.
 */
export function useExclusiveMenu({
  id,
  open,
  onClose,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }
    window.dispatchEvent(
      new CustomEvent<string>(EXCLUSIVE_MENU_OPEN_EVENT, { detail: id }),
    );
    const handleOtherMenuOpened = (event: Event) => {
      if (event instanceof CustomEvent && event.detail !== id) {
        onClose();
      }
    };
    window.addEventListener(EXCLUSIVE_MENU_OPEN_EVENT, handleOtherMenuOpened);
    return () =>
      window.removeEventListener(
        EXCLUSIVE_MENU_OPEN_EVENT,
        handleOtherMenuOpened,
      );
  }, [open, id, onClose]);
}

const EXCLUSIVE_MENU_OPEN_EVENT = 'ap-exclusive-menu-open';
