import { isEditableTarget } from '@/lib/dom-utils';

function root(): HTMLDivElement {
  if (!chatNode) {
    chatNode = document.createElement('div');
    chatNode.className = 'flex h-full w-full flex-col';
    chatNode.dataset.chatRoot = '';
  }
  return chatNode;
}

function composer(): HTMLElement | null {
  return root().querySelector<HTMLElement>(COMPOSER);
}

function scroller(): HTMLElement | null {
  return root().querySelector<HTMLElement>('[role="log"] > div');
}

function inChat(target: EventTarget | null | undefined): boolean {
  return target instanceof Element && target.closest(ROOT) !== null;
}

function isTypingIn(target: EventTarget | null): boolean {
  return (
    isEditableTarget(target) &&
    !(target instanceof HTMLSelectElement) &&
    !(target instanceof HTMLInputElement && NON_TEXT_INPUTS.has(target.type))
  );
}

function escapeFree(event: KeyboardEvent): boolean {
  if (claimedEscapes.has(event) || modalLayerOpen()) return false;
  return !event.defaultPrevented || passiveLayerOpen();
}

function claimEscape(event: KeyboardEvent): void {
  claimedEscapes.add(event);
  event.preventDefault();
}

function modalLayerOpen(): boolean {
  return Array.from(document.querySelectorAll(LAYERS)).some(
    (layer) =>
      layer.getAttribute('data-state') !== 'closed' &&
      !inChat(layer) &&
      isModal(layer),
  );
}

function isModal(layer: Element): boolean {
  const role = layer.getAttribute('role');
  if (role === 'alertdialog' || role === 'menu') return true;
  return (
    layer.getAttribute('aria-modal') === 'true' ||
    layer.closest(POPPER) === null
  );
}

function passiveLayerOpen(): boolean {
  return Array.from(document.querySelectorAll(POPPER)).some(
    (wrapper) => wrapper.querySelector(LAYERS_WITH_LISTBOX) === null,
  );
}

let chatNode: HTMLDivElement | null = null;
const claimedEscapes = new WeakSet<KeyboardEvent>();
const POPPER = '[data-radix-popper-content-wrapper]';
const ROOT = '[data-chat-root]';
const COMPOSER = 'textarea, [contenteditable="true"]';
const LAYERS = '[role="dialog"], [role="alertdialog"], [role="menu"]';
const LAYERS_WITH_LISTBOX = `${LAYERS}, [role="listbox"]`;
const NON_TEXT_INPUTS = new Set([
  'checkbox',
  'radio',
  'button',
  'submit',
  'range',
]);

export const chatDom = {
  root,
  composer,
  scroller,
  inChat,
  isTypingIn,
  escapeFree,
  claimEscape,
  modalLayerOpen,
  ROOT,
  COMPOSER,
  LAYERS,
};
