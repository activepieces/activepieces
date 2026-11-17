import { flushSync } from 'react-dom';

import { errorReporting } from '@/lib/error-reporting';

import { chatLayoutUtils } from './chat-layout';
import { windowSizeHooks } from './window-size-hooks';

function run({
  update,
  waitForRoute,
}: {
  update: () => void;
  waitForRoute: boolean;
}): void {
  if (applying) {
    update();
    return;
  }
  active?.skipTransition();
  routeCommitted();
  const start = startViewTransition();
  if (!start || !canAnimate()) {
    update();
    return;
  }
  const root = document.documentElement;
  const move = start(() =>
    waitForRoute
      ? new Promise<void>((resolve) => {
          commitWaiter = resolve;
          setTimeout(resolve, COMMIT_TIMEOUT_MS);
          apply(update);
        })
      : flushSync(() => apply(update)),
  );
  if (!move) return;
  active = move;
  root.dataset.chatMove = '';
  move.finished
    .finally(() => {
      if (active !== move) return;
      active = null;
      delete root.dataset.chatMove;
    })
    .catch((error: unknown) =>
      errorReporting.report({ error, source: 'chat-layout-move' }),
    );
}

function apply(update: () => void): void {
  applying = true;
  try {
    update();
  } finally {
    applying = false;
  }
}

function routeCommitted(): void {
  const waiter = commitWaiter;
  commitWaiter = null;
  waiter?.();
}

function startViewTransition(): StartViewTransition | null {
  const start: unknown = Reflect.get(document, 'startViewTransition');
  if (typeof start !== 'function') return null;
  return (callback) => {
    const transition: unknown = start.call(document, callback);
    return isLayoutTransition(transition) ? transition : null;
  };
}

function isLayoutTransition(value: unknown): value is LayoutTransition {
  return (
    typeof value === 'object' &&
    value !== null &&
    Reflect.get(value, 'finished') instanceof Promise &&
    typeof Reflect.get(value, 'skipTransition') === 'function'
  );
}

function canAnimate(): boolean {
  return (
    !windowSizeHooks.isPhone() &&
    !chatLayoutUtils.prefersReducedMotion() &&
    !keyPressInProgress
  );
}

function markKeyPress(): void {
  keyPressInProgress = true;
  setTimeout(() => {
    keyPressInProgress = false;
  }, 0);
}

function watchKeyPresses(): () => void {
  window.addEventListener('keydown', markKeyPress, true);
  window.addEventListener('keyup', markKeyPress, true);
  return () => {
    window.removeEventListener('keydown', markKeyPress, true);
    window.removeEventListener('keyup', markKeyPress, true);
    keyPressInProgress = false;
  };
}

let active: LayoutTransition | null = null;
let commitWaiter: (() => void) | null = null;
let applying = false;
let keyPressInProgress = false;

const COMMIT_TIMEOUT_MS = 300;

export const layoutMove = {
  run,
  routeCommitted,
  watchKeyPresses,
};

type LayoutTransition = {
  finished: Promise<void>;
  skipTransition: () => void;
};

type StartViewTransition = (
  callback: () => Promise<void> | void,
) => LayoutTransition | null;
