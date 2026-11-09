// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ChatNavTarget,
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, string>) =>
    key.replace('{name}', values?.name ?? ''),
}));

function bind(hash: string) {
  const navigations: ChatNavTarget[] = [];
  const unbind = chatPanelUtils.bindRouter({
    navigate: (target) => navigations.push(target),
    location: () => ({
      pathname: '/projects/p1/automations',
      hash,
      state: null,
    }),
    isFullPage: () => false,
  });
  return { navigations, unbind };
}

describe('chatPanelUtils.openBeside', () => {
  beforeEach(() => {
    useChatPanel.setState({ announcement: null });
  });

  it('keeps the phone chat sheet open over the opened page', () => {
    const { navigations, unbind } = bind(chatPanelUtils.SHEET_HASH);
    chatPanelUtils.openBeside({
      route: '/projects/p1/tables/t1',
      push: true,
      name: 'Leads',
    });
    unbind();

    expect(navigations).toEqual([
      { to: '/projects/p1/tables/t1#chat', replace: false },
    ]);
    expect(useChatPanel.getState().announcement?.text).toBe(
      'Opened Leads behind the chat.',
    );
  });

  it('opens the page beside the docked chat', () => {
    const { navigations, unbind } = bind('');
    chatPanelUtils.openBeside({
      route: '/projects/p1/tables/t1',
      push: false,
      name: 'Leads',
    });
    unbind();

    expect(navigations).toEqual([
      { to: '/projects/p1/tables/t1', replace: true },
    ]);
    expect(useChatPanel.getState().announcement?.text).toBe(
      'Opened Leads beside the chat.',
    );
  });
});

describe('chatPanelUtils.showOnFullPage', () => {
  it('keeps the docked-chat mark when the full page swaps chats', () => {
    const navigations: ChatNavTarget[] = [];
    const unbind = chatPanelUtils.bindRouter({
      navigate: (target) => navigations.push(target),
      location: () => ({
        pathname: '/chat',
        hash: '',
        state: { chatExpanded: true },
      }),
      isFullPage: () => true,
    });
    chatPanelUtils.showOnFullPage('c1');
    chatPanelUtils.startNewChat();
    unbind();

    expect(navigations).toEqual([
      { to: '/chat/c1', replace: true, state: { chatExpanded: true } },
      { to: '/chat', replace: true, state: { chatExpanded: true } },
    ]);
  });

  it('goes back to the page under the chat after the first message', () => {
    const navigations: ChatNavTarget[] = [];
    let state: unknown = { chatExpanded: true };
    const unbind = chatPanelUtils.bindRouter({
      navigate: (target) => {
        navigations.push(target);
        if ('to' in target) state = target.state;
      },
      location: () => ({ pathname: '/chat', hash: '', state }),
      isFullPage: () => true,
    });
    chatPanelUtils.showOnFullPage('c1');
    chatPanelUtils.collapse('right');
    unbind();

    expect(navigations.at(-1)).toEqual({ back: true });
  });
});
