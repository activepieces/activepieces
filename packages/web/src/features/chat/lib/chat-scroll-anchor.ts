import { MOTION, chatLayoutUtils } from '@/features/workspace/lib/chat-layout';

function scroller(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    `#${chatLayoutUtils.PANEL_ID} [role="log"] > div`,
  );
}

function capture(): void {
  const el = scroller();
  if (!el || el.clientHeight === 0) {
    return;
  }
  const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
  if (gap <= PINNED_GAP) {
    anchor = { pinned: true };
    return;
  }
  const top = el.getBoundingClientRect().top;
  const element = firstElementFrom({ scroller: el, top });
  anchor = element
    ? {
        pinned: false,
        element,
        offset: element.getBoundingClientRect().top - top,
      }
    : null;
}

function restore(): void {
  apply();
  hold();
}

function apply(): void {
  const saved = anchor;
  const el = scroller();
  if (!saved || !el || el.clientHeight === 0) return;
  if (saved.pinned) {
    el.scrollTop = el.scrollHeight;
    return;
  }
  if (!saved.element.isConnected) return;
  const top = el.getBoundingClientRect().top;
  el.scrollTop +=
    saved.element.getBoundingClientRect().top - top - saved.offset;
}

function hold(): void {
  release?.();
  const el = scroller();
  const content = el?.firstElementChild;
  if (!anchor || !el || !content) return;
  const observer = new ResizeObserver(apply);
  observer.observe(content);
  observer.observe(el);
  const stop = () => {
    observer.disconnect();
    clearTimeout(timer);
    USER_SCROLL_EVENTS.forEach((type) => el.removeEventListener(type, stop));
    if (release === stop) release = null;
  };
  const timer = setTimeout(stop, HOLD_MS);
  USER_SCROLL_EVENTS.forEach((type) =>
    el.addEventListener(type, stop, { passive: true }),
  );
  release = stop;
}

function firstElementFrom({
  scroller,
  top,
}: {
  scroller: HTMLElement;
  top: number;
}): Element | null {
  const walker = document.createTreeWalker(scroller, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (node) => {
      if (!(node instanceof Element)) return NodeFilter.FILTER_SKIP;
      const rect = node.getBoundingClientRect();
      if (rect.bottom <= top) return NodeFilter.FILTER_REJECT;
      return rect.height > 0 && rect.top >= top - STRADDLE
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP;
    },
  });
  const first = walker.nextNode();
  if (!(first instanceof Element)) return null;
  let element = first;
  const startsWith = (child: Element) =>
    Math.abs(
      child.getBoundingClientRect().top - element.getBoundingClientRect().top,
    ) < 1 && child.getBoundingClientRect().height > 0;
  let child = Array.from(element.children).find(startsWith);
  while (child) {
    element = child;
    child = Array.from(element.children).find(startsWith);
  }
  return element;
}

const PINNED_GAP = 24;
const HOLD_MS = MOTION.move * 1000 + 300;
const STRADDLE = 8;
const USER_SCROLL_EVENTS: Array<'wheel' | 'touchstart' | 'keydown'> = [
  'wheel',
  'touchstart',
  'keydown',
];

let anchor: ChatAnchor | null = null;
let release: (() => void) | null = null;

type ChatAnchor =
  | { pinned: true }
  | { pinned: false; element: Element; offset: number };

export const chatScrollAnchor = { capture, restore };
