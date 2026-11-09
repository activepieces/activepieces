import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';

function inChat(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest(`#${chatLayoutUtils.PANEL_ID}`) !== null
  );
}

function isBusyIn(focused: Element | null): boolean {
  return focused !== null && !inChat(focused) && focused.closest(BUSY) !== null;
}

function isAwayIn(focused: Element | null): boolean {
  return (
    focused !== null &&
    focused !== document.body &&
    focused !== document.documentElement &&
    !inChat(focused)
  );
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const BUSY =
  'input, textarea, select, [contenteditable="true"], [role="dialog"], [role="alertdialog"]';

export const pageFocus = {
  inChat,
  isBusyIn,
  isAwayIn,
  prefersReducedMotion,
};
