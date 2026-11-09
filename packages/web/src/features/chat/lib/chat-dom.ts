import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';

function composer(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `#${chatLayoutUtils.PANEL_ID} textarea`,
  );
}

function escapeFree(event: KeyboardEvent): boolean {
  return !claimedEscapes.has(event) && !layerOpen();
}

function claimEscape(event: KeyboardEvent): void {
  claimedEscapes.add(event);
  event.preventDefault();
}

function layerOpen(): boolean {
  return Array.from(document.querySelectorAll(LAYERS)).some(
    (layer) => layer.getAttribute('data-state') !== 'closed',
  );
}

const claimedEscapes = new WeakSet<KeyboardEvent>();
const LAYERS =
  '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';

export const chatDom = {
  composer,
  escapeFree,
  claimEscape,
};
