import { chatDom } from './chat-dom';

function keep(): void {
  release?.();
  const kept = document.activeElement;
  if (!(kept instanceof HTMLElement) || !chatDom.inChat(kept)) {
    return;
  }
  const target = (): HTMLElement | null =>
    kept.isConnected ? kept : chatDom.composer();

  const giveBack = () => {
    const into = target();
    if (!into || into.closest('[inert]')) return;
    into.focus({ preventScroll: true });
  };
  const onFocusIn = (event: FocusEvent) => {
    const to = event.target;
    if (!(to instanceof Element) || chatDom.inChat(to)) return;
    if (to.closest(chatDom.OVERLAY_SELECTOR)) {
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

const GUARD_MS = 2000;

let release: (() => void) | null = null;

export const keepComposerFocus = { keep };
