import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';
import { isEditableTarget } from '@/lib/dom-utils';

function composer(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `#${chatLayoutUtils.PANEL_ID} [${COMPOSER_ATTRIBUTE}]`,
  );
}

function inChat(target: EventTarget | null | undefined): boolean {
  return (
    target instanceof Element &&
    target.closest(`#${chatLayoutUtils.PANEL_ID}`) !== null
  );
}

function escapeFree(event: KeyboardEvent): boolean {
  return !claimedEscapes.has(event) && !layerOpen();
}

function claimEscape(event: KeyboardEvent): void {
  claimedEscapes.add(event);
  event.preventDefault();
}

function isCardField(target: EventTarget | null): boolean {
  return (
    isEditableTarget(target) &&
    target instanceof Element &&
    target.closest(`[${COMPOSER_ATTRIBUTE}]`) === null
  );
}

function shortcutOf(event: KeyboardEvent): ChatShortcut | null {
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return null;
  if (inCodeEditor(event.target)) return null;
  const key = event.key.toLowerCase();
  if (event.shiftKey && key === 'o') return 'newChat';
  if (event.shiftKey && key === 'h') return 'history';
  if (!event.shiftKey && key === 'j') return 'toggle';
  return null;
}

function inCodeEditor(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(CODE_EDITOR) !== null;
}

function layerOpen(): boolean {
  const panel = document.getElementById(chatLayoutUtils.PANEL_ID);
  return Array.from(document.querySelectorAll(OPEN_OVERLAYS)).some(
    (layer) => !panel?.contains(layer),
  );
}

const COMPOSER_ATTRIBUTE = 'data-chat-composer';
const CODE_EDITOR = '.cm-editor, .monaco-editor';
const claimedEscapes = new WeakSet<KeyboardEvent>();
const OPEN_OVERLAYS = ['dialog', 'alertdialog', 'menu', 'listbox']
  .map((role) => `[role="${role}"][data-state="open"]`)
  .join(', ');

export const chatDom = {
  composer,
  inChat,
  escapeFree,
  claimEscape,
  shortcutOf,
  isCardField,
};

type ChatShortcut = 'toggle' | 'newChat' | 'history';
