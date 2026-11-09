import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';

import { chatDom } from './chat-dom';

// When the chat changes the page beside it, the new page may grab focus
// (autofocus fields, focus traps, a removed element dropping focus to body).
// If the user was typing in the chat, hand focus straight back, until the user
// moves it themselves or the page has had time to settle.
function keep(): void {
  release?.();
  const kept = document.activeElement;
  if (!(kept instanceof HTMLElement) || !chatDom.inChat(kept)) {
    return;
  }
  const target = (): HTMLElement | null =>
    kept.isConnected
      ? kept
      : document.querySelector<HTMLElement>(`${PANEL} textarea`);

  const giveBack = () => {
    const into = target();
    if (!into || into.closest('[inert]')) return;
    into.focus({ preventScroll: true });
  };
  const onFocusIn = (event: FocusEvent) => {
    const to = event.target;
    if (!(to instanceof Element) || chatDom.inChat(to)) return;
    if (to.closest(LAYERS)) {
      stop();
      return;
    }
    giveBack();
  };
  const onFocusOut = (event: FocusEvent) => {
    if (event.relatedTarget !== null || !chatDom.inChat(event.target)) return;
    queueMicrotask(() => {
      const active = document.activeElement;
      if (!active || active === document.body) giveBack();
    });
  };
  const onPointer = (event: PointerEvent) => {
    if (!chatDom.inChat(event.target)) stop();
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Tab') stop();
  };
  const stop = () => {
    document.removeEventListener('focusin', onFocusIn, true);
    document.removeEventListener('focusout', onFocusOut, true);
    document.removeEventListener('pointerdown', onPointer, true);
    document.removeEventListener('keydown', onKey, true);
    clearTimeout(timer);
    if (release === stop) release = null;
  };
  const timer = setTimeout(stop, GUARD_MS);
  document.addEventListener('focusin', onFocusIn, true);
  document.addEventListener('focusout', onFocusOut, true);
  document.addEventListener('pointerdown', onPointer, true);
  document.addEventListener('keydown', onKey, true);
  release = stop;
}

const PANEL = `#${chatLayoutUtils.PANEL_ID}`;
const LAYERS = '[role="dialog"], [role="alertdialog"], [role="menu"]';
const GUARD_MS = 2000;

let release: (() => void) | null = null;

export const keepComposerFocus = { keep };
