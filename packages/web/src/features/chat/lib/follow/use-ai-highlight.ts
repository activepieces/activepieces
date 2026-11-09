import { useEffect, useRef } from 'react';

import { aiSheen } from './ai-sheen';
import { useFollowAlong } from './follow-along';
import { pageFocus } from './page-focus';

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
    const events: (keyof WindowEventMap)[] = ['wheel', 'touchmove', 'keydown'];
    events.forEach((name) =>
      window.addEventListener(name, mark, { capture: true, passive: true }),
    );
    return () =>
      events.forEach((name) =>
        window.removeEventListener(name, mark, { capture: true }),
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
      return aiSheen.play(elements) ? elements : [];
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
