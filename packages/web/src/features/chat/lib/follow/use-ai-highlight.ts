import { useEffect, useRef } from 'react';

import { ResourceRef } from '../resources/registry';

import { aiSheen } from './ai-sheen';
import { followAlong, useFollowAlong } from './follow-along';
import { pageFocus } from './page-focus';

// Lights `key` when its component mounts after the AI changed it out of view.
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
      if (pageFocus.inChat(event.target)) return;
      if (event instanceof KeyboardEvent && !SCROLL_KEYS.has(event.key)) {
        return;
      }
      takeScroll();
    };
    // Dragging a scrollbar fires no wheel or key event, only scrolls while
    // the pointer is held down outside the chat.
    let pointerDown = false;
    const press = (event: Event) => {
      pointerDown = !pageFocus.inChat(event.target);
    };
    const release = () => {
      pointerDown = false;
    };
    const scrolled = (event: Event) => {
      if (pointerDown && !pageFocus.inChat(event.target)) takeScroll();
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
      return aiSheen.play({ id: `${key}:${token}`, elements })
        ? elements
        : [];
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
  if (!claimScroll()) return;
  element.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
    behavior: pageFocus.prefersReducedMotion() ? 'auto' : 'smooth',
  });
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
