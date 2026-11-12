import { useEffect, useRef } from 'react';

import { chatDom } from '@/features/chat/lib/chat-dom';
import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';

import { ResourceRef } from '../resources/registry';

import { aiSheen } from './ai-sheen';
import { followAlong, useFollowAlong } from './follow-along';

export function useAiHighlight({
  resource,
  key,
}: {
  resource: Pick<ResourceRef, 'kind' | 'id'>;
  key: string;
}): void {
  const { kind, id } = resource;
  useEffect(() => {
    if (followAlong.takeUnseen({ resource: { kind, id }, key })) {
      followAlong.flash([key]);
    }
  }, [kind, id, key]);
}

export function useAiFieldHighlights(): void {
  const flashes = useFollowAlong((state) => state.flashes);
  const shown = useRef<Record<string, number>>({});
  useEffect(() => {
    const mark = (event: Event) => {
      if (chatDom.inChat(event.target)) return;
      if (event instanceof KeyboardEvent && !SCROLL_KEYS.has(event.key)) {
        return;
      }
      takeScroll();
    };
    let pointerDown = false;
    const press = (event: Event) => {
      pointerDown = !chatDom.inChat(event.target);
    };
    const release = () => {
      pointerDown = false;
    };
    const scrolled = (event: Event) => {
      if (pointerDown && !chatDom.inChat(event.target)) takeScroll();
    };
    const listeners: [keyof WindowEventMap, (event: Event) => void][] = [
      ['wheel', mark],
      ['touchmove', mark],
      ['keydown', mark],
      ['pointerdown', press],
      ['pointerup', release],
      ['pointercancel', release],
      ['scroll', scrolled],
    ];
    listeners.forEach(([name, listener]) =>
      window.addEventListener(name, listener, { capture: true, passive: true }),
    );
    return () =>
      listeners.forEach(([name, listener]) =>
        window.removeEventListener(name, listener, { capture: true }),
      );
  }, []);
  useEffect(() => {
    const previous = shown.current;
    shown.current = flashes;
    const lit = Object.entries(flashes).flatMap(([key, token]) => {
      if (previous[key] === token) return [];
      const elements = [
        ...document.querySelectorAll(`[data-ai-field="${CSS.escape(key)}"]`),
      ];
      return aiSheen.play({ id: `${key}:${token}`, elements }) ? elements : [];
    });
    const first = lit.find(
      (element) => element.getAttribute('data-ai-scroll') !== 'canvas',
    );
    if (first) scrollIntoView(first);
  }, [flashes]);
}

function mayScroll(): boolean {
  return !useFollowAlong.getState().scrollTaken;
}

function takeScroll(): void {
  if (!mayScroll()) return;
  useFollowAlong.setState({ scrollTaken: true });
}

function claimScroll(): boolean {
  if (!mayScroll()) return false;
  takeScroll();
  return true;
}

function scrollIntoView(element: Element): void {
  if (isInViewport(element) || !claimScroll()) return;
  element.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
    behavior: chatLayoutUtils.prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

function isInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
]);

export const aiHighlight = {
  mayScroll,
  claimScroll,
};
