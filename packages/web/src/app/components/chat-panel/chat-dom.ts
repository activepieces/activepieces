function root(): HTMLDivElement {
  if (!chatNode) {
    chatNode = document.createElement('div');
    chatNode.className = 'flex h-full w-full flex-col';
    chatNode.dataset.chatRoot = '';
  }
  return chatNode;
}

function composer(): HTMLElement | null {
  return root().querySelector<HTMLElement>(
    'textarea, [contenteditable="true"]',
  );
}

function scroller(): HTMLElement | null {
  return root().querySelector<HTMLElement>('[role="log"] > div');
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
  return Array.from(document.querySelectorAll(LAYER_ROLES)).some(
    (layer) =>
      layer.getAttribute('data-state') !== 'closed' &&
      !layer.closest('[data-chat-root]') &&
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
    (wrapper) => wrapper.querySelector(LAYER_ROLES_WITH_LISTBOX) === null,
  );
}

let chatNode: HTMLDivElement | null = null;
const claimedEscapes = new WeakSet<KeyboardEvent>();
const POPPER = '[data-radix-popper-content-wrapper]';
const LAYER_ROLES = '[role="dialog"], [role="alertdialog"], [role="menu"]';
const LAYER_ROLES_WITH_LISTBOX = `${LAYER_ROLES}, [role="listbox"]`;

export const chatDom = { root, composer, scroller, escapeFree, claimEscape };
