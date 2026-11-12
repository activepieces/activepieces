// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ChatNavTarget,
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';

vi.mock('i18next', () => ({ t: (key: string) => key }));

function bind({ fullPage }: { fullPage: boolean }) {
  const navigations: ChatNavTarget[] = [];
  const unbind = chatPanelUtils.bindRouter({
    navigate: (target) => navigations.push(target),
    location: () => ({
      pathname: fullPage ? '/chat' : '/projects/p1/automations',
      search: '',
      hash: '',
      state: fullPage ? { chatExpanded: true } : null,
    }),
    isFullPage: () => fullPage,
  });
  return { navigations, unbind };
}

function stubViewTransitions() {
  const skipTransition = vi.fn();
  const start = vi.fn((update: () => Promise<void> | void) => {
    const done = Promise.resolve(update());
    return { finished: done.then(() => undefined), skipTransition };
  });
  Object.defineProperty(document, 'startViewTransition', {
    value: start,
    configurable: true,
  });
  return start;
}

describe('dock and full page moves', () => {
  beforeEach(() => {
    window.innerWidth = 1280;
    Object.defineProperty(window, 'matchMedia', {
      value: () => ({ matches: false }),
      configurable: true,
    });
    useChatPanel.setState({ open: true, mode: 'left', conversationId: null });
  });

  afterEach(() => {
    Reflect.deleteProperty(document, 'startViewTransition');
  });

  it('switches at once when the browser has no View Transitions', () => {
    const expanding = bind({ fullPage: false });
    chatPanelUtils.expand();
    expanding.unbind();

    const collapsing = bind({ fullPage: true });
    chatPanelUtils.collapse('right');
    collapsing.unbind();

    expect(expanding.navigations).toEqual([
      {
        to: chatPanelUtils.routeFor(null),
        replace: false,
        state: { chatExpanded: true },
      },
    ]);
    expect(collapsing.navigations).toEqual([{ back: true }]);
    expect(useChatPanel.getState()).toMatchObject({
      open: true,
      mode: 'right',
    });
  });

  it('runs expand and collapse inside a View Transition when there is one', async () => {
    const start = stubViewTransitions();

    const expanding = bind({ fullPage: false });
    chatPanelUtils.expand();
    expect(document.documentElement.dataset.chatMove).toBe('');
    chatPanelUtils.routeCommitted();
    await start.mock.results[0].value.finished;
    expanding.unbind();

    const collapsing = bind({ fullPage: true });
    chatPanelUtils.collapse('right');
    chatPanelUtils.routeCommitted();
    await start.mock.results[1].value.finished;
    collapsing.unbind();

    expect(start).toHaveBeenCalledTimes(2);
    expect(expanding.navigations).toHaveLength(1);
    expect(collapsing.navigations).toEqual([{ back: true }]);
    expect(useChatPanel.getState().mode).toBe('right');
    expect(document.documentElement.dataset.chatMove).toBeUndefined();
  });
});
