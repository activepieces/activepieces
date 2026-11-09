// @vitest-environment jsdom
import { createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';

describe('chatPanelUtils.followRouter', () => {
  let stop: (() => void) | null = null;

  beforeEach(() => {
    useChatPanel.setState({ conversationId: null, lastPage: null });
  });

  afterEach(() => {
    stop?.();
    stop = null;
  });

  it('remembers the last app page, with its query', () => {
    follow('/projects/p1/automations?folder=f1');

    expect(useChatPanel.getState().lastPage).toBe(
      '/projects/p1/automations?folder=f1',
    );
  });

  it('shows the chat from the chat page URL', async () => {
    const router = follow('/projects/p1/automations');

    await router.navigate('/chat/c2');

    expect(useChatPanel.getState().conversationId).toBe('c2');
    expect(useChatPanel.getState().lastPage).toBe('/projects/p1/automations');
  });

  it('keeps the docked chat when plain /chat opens', async () => {
    useChatPanel.setState({ conversationId: 'c1' });
    const router = follow('/projects/p1/automations');

    await router.navigate('/chat');

    expect(useChatPanel.getState().conversationId).toBe('c1');
  });

  it('ignores pages outside the app shell', async () => {
    const router = follow('/projects/p1/automations');

    await router.navigate('/sign-in');

    expect(useChatPanel.getState().lastPage).toBe('/projects/p1/automations');
  });

  it('never remembers a redirect-only route as the last page', async () => {
    const router = follow('/projects/p1/automations');

    await router.navigate('/projects/p1');
    await router.navigate('/');
    await router.navigate('/chat/c2');

    expect(useChatPanel.getState().lastPage).toBe('/projects/p1/automations');
  });

  it('leaves no last page when only redirect-only routes were seen', () => {
    follow('/');

    expect(useChatPanel.getState().lastPage).toBeNull();
  });

  function follow(path: string) {
    const router = createMemoryRouter(ROUTES, { initialEntries: [path] });
    stop = chatPanelUtils.followRouter(router);
    return router;
  }
});

const ROUTES = [
  { path: '/sign-in', element: null },
  {
    path: '/projects/:projectId/automations',
    handle: { shell: 'project' },
    element: null,
  },
  {
    path: '/projects/:projectId',
    handle: { shell: 'project', redirectOnly: true },
    element: null,
  },
  { path: '/chat', handle: { shell: 'project', chat: 'full' }, element: null },
  {
    path: '/chat/:conversationId',
    handle: { shell: 'project', chat: 'full' },
    element: null,
  },
  {
    path: '/*',
    handle: { shell: 'project', allowAnonymous: true, redirectOnly: true },
    element: null,
  },
];
