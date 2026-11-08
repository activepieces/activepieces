import { useEffect } from 'react';

import { resourceRegistry } from '../resources/registry';

import { FollowChange, followAlong, useFollowAlong } from './follow-along';

export function useAiHighlight(key: string): boolean {
  useEffect(() => {
    const unseen = Object.values(useFollowAlong.getState().runs)
      .flatMap((run) => run.changes)
      .filter((change) => touches({ change, key }) && !shown.has(change));
    if (unseen.length > 0) {
      unseen.forEach((change) => shown.add(change));
      followAlong.flash([key]);
    }
    return followAlong.onToolDone((change) => {
      if (!touches({ change, key })) return;
      shown.add(change);
      followAlong.flash([key]);
    });
  }, [key]);
  return useFollowAlong((state) => key in state.flashes);
}

export function useAiFieldHighlights(): void {
  const flashes = useFollowAlong((state) => state.flashes);
  useEffect(() => {
    installTracking();
  }, []);
  useEffect(() => {
    document.querySelectorAll('[data-ai-glow]').forEach((element) => {
      const key = element.getAttribute('data-ai-field');
      if (!key || !(key in flashes)) element.removeAttribute('data-ai-glow');
    });
    const lit: Element[] = [];
    for (const [key, token] of Object.entries(flashes)) {
      const selector = `[data-ai-field="${CSS.escape(key)}"]`;
      for (const element of document.querySelectorAll(selector)) {
        if (element.getAttribute('data-ai-glow') === String(token)) continue;
        element.removeAttribute('data-ai-glow');
        element.getBoundingClientRect();
        element.setAttribute('data-ai-glow', String(token));
        lit.push(element);
      }
    }
    if (lit[0]) scrollIntoView(lit[0]);
  }, [flashes]);
}

function touches({
  change,
  key,
}: {
  change: FollowChange;
  key: string;
}): boolean {
  return (
    resourceRegistry.isChange(change.outcome) && change.highlights.includes(key)
  );
}

function mayScroll(): boolean {
  installTracking();
  return lastUserScrollAt <= runStartedAt;
}

function scrollIntoView(element: Element): void {
  if (!mayScroll()) return;
  element.scrollIntoView({
    block: 'nearest',
    inline: 'nearest',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function installTracking(): void {
  if (tracking) return;
  tracking = true;
  const mark = (event: Event) => {
    const target = event.target;
    if (target instanceof Element && target.closest('[data-chat-root]')) {
      return;
    }
    if (event instanceof KeyboardEvent && !SCROLL_KEYS.has(event.key)) return;
    lastUserScrollAt = Date.now();
  };
  const options = { capture: true, passive: true };
  window.addEventListener('wheel', mark, options);
  window.addEventListener('touchmove', mark, options);
  window.addEventListener('keydown', mark, options);
  useFollowAlong.subscribe((state, previous) => {
    if (state.phase === 'editing' && previous.phase !== 'editing') {
      runStartedAt = Date.now();
    }
  });
}

const shown = new WeakSet<FollowChange>();
let tracking = false;
let lastUserScrollAt = 0;
let runStartedAt = 0;

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
  scrollIntoView,
  prefersReducedMotion,
};
