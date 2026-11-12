// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { layoutMove } from '@/features/workspace/lib/layout-move';

const reported = vi.hoisted(() => ({ errors: [] as unknown[] }));

vi.mock('@/lib/error-reporting', () => ({
  errorReporting: {
    report: ({ error }: { error: unknown }) => reported.errors.push(error),
  },
}));

function stubViewTransitions() {
  const start = vi.fn((update: () => Promise<void> | void) => {
    const done = Promise.resolve().then(() => update());
    return { finished: done.then(() => undefined), skipTransition: vi.fn() };
  });
  Object.defineProperty(document, 'startViewTransition', {
    value: start,
    configurable: true,
  });
  return start;
}

describe('layoutMove', () => {
  beforeEach(() => {
    reported.errors.length = 0;
    window.innerWidth = 1280;
    Object.defineProperty(window, 'matchMedia', {
      value: () => ({ matches: false }),
      configurable: true,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(document, 'startViewTransition');
  });

  it('does not listen to keys until something asks it to', () => {
    const start = stubViewTransitions();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
    layoutMove.run({ update: () => undefined, waitForRoute: false });

    expect(start).toHaveBeenCalledTimes(1);
  });

  it('switches at once for a move started by a key press while watching', () => {
    const start = stubViewTransitions();
    const stop = layoutMove.watchKeyPresses();
    const update = vi.fn();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
    layoutMove.run({ update, waitForRoute: false });
    stop();

    expect(start).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('stops listening once the watcher is cleaned up', () => {
    const start = stubViewTransitions();
    layoutMove.watchKeyPresses()();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
    layoutMove.run({ update: () => undefined, waitForRoute: false });

    expect(start).toHaveBeenCalledTimes(1);
  });

  it('reports a move whose update throws', async () => {
    const start = stubViewTransitions();
    const failure = new Error('navigate failed');

    layoutMove.run({
      update: () => {
        throw failure;
      },
      waitForRoute: false,
    });
    await start.mock.results[0].value.finished.catch(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(reported.errors).toEqual([failure]);
  });
});
