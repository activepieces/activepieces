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
  const panel = document.getElementById(chatLayoutUtils.PANEL_ID);
  return Array.from(document.querySelectorAll(OPEN_OVERLAYS)).some(
    (layer) => !panel?.contains(layer),
  );
}

const claimedEscapes = new WeakSet<KeyboardEvent>();
const OPEN_OVERLAYS = ['dialog', 'alertdialog', 'menu', 'listbox']
  .map((role) => `[role="${role}"][data-state="open"]`)
  .join(', ');

export const chatDom = {
  composer,
  escapeFree,
  claimEscape,
};
