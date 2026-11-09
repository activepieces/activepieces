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
