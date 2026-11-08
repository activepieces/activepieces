import { useEffect } from 'react';

import { resourceRegistry } from '../resources/registry';

import { RunChange, followAlong, useFollowAlong } from './follow-along';

export function useAiHighlight(key: string): boolean {
  useEffect(() => {
    const unseen = Object.values(useFollowAlong.getState().runs)
      .flatMap((run) => run.changes)
      .filter(
        (change) =>
          touches({ change, key }) && !shown.has(shownKey({ change, key })),
      );
    if (unseen.length > 0) {
      unseen.forEach((change) => shown.add(shownKey({ change, key })));
      followAlong.flash([key]);
    }
    return followAlong.onToolDone((change) => {
      const done = {
        toolCallId: change.toolCallId,
        highlights: change.highlights,
        changed: resourceRegistry.isChange(change.outcome),
      };
      if (!touches({ change: done, key })) return;
      shown.add(shownKey({ change: done, key }));
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
  change: HighlightSource;
  key: string;
}): boolean {
  return change.changed && change.highlights.includes(key);
}

function shownKey({
  change,
  key,
}: {
  change: HighlightSource;
  key: string;
}): string {
  return `${change.toolCallId}:${key}`;
}

function mayScroll(): boolean {
  installTracking();
  return lastUserScrollAt <= runStartedAt && !scrolledThisRun;
}

function claimScroll(): boolean {
  if (!mayScroll()) return false;
  scrolledThisRun = true;
  programmaticScrollUntil = Date.now() + PROGRAMMATIC_SCROLL_MS;
  return true;
}

function scrollIntoView(element: Element): void {
  if (!claimScroll()) return;
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
  if (tracking || typeof window === 'undefined') return;
  tracking = true;
  const inChat = (target: EventTarget | null) =>
    target instanceof Element && target.closest('[data-chat-root]') !== null;
  const mark = (event: Event) => {
    if (inChat(event.target)) return;
    if (event instanceof KeyboardEvent && !SCROLL_KEYS.has(event.key)) return;
    lastUserScrollAt = Date.now();
  };
  const onScroll = (event: Event) => {
    if (inChat(event.target)) return;
    if (pointerDown || Date.now() > programmaticScrollUntil) {
      lastUserScrollAt = Date.now();
    }
  };
  const options = { capture: true, passive: true };
  window.addEventListener('wheel', mark, options);
  window.addEventListener('touchmove', mark, options);
  window.addEventListener('keydown', mark, options);
  window.addEventListener('scroll', onScroll, options);
  window.addEventListener(
    'pointerdown',
    (event) => {
      pointerDown = !inChat(event.target);
    },
    options,
  );
  window.addEventListener(
    'pointerup',
    () => {
      pointerDown = false;
    },
    options,
  );
  useFollowAlong.subscribe((state, previous) => {
    if (state.phase === 'editing' && previous.phase !== 'editing') {
      runStartedAt = Date.now();
      scrolledThisRun = false;
    }
  });
}

const shown = new Set<string>();
let tracking = false;
let lastUserScrollAt = 0;
let runStartedAt = 0;
let scrolledThisRun = false;
let pointerDown = false;
let programmaticScrollUntil = 0;
const PROGRAMMATIC_SCROLL_MS = 1500;

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
  scrollIntoView,
  prefersReducedMotion,
};

type HighlightSource = Pick<RunChange, 'toolCallId' | 'highlights' | 'changed'>;

installTracking();
