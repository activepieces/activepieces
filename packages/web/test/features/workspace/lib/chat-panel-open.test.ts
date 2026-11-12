// @vitest-environment jsdom
import { createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ChatNavTarget,
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';

import { tokenFixtures } from '../../../helpers/user-token';

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, string>) =>
    key.replace('{name}', values?.name ?? ''),
}));

vi.mock('@/app/query-client', () => ({
  queryClient: { invalidateQueries: vi.fn() },
}));

const { userToken } = tokenFixtures;

function loadStore() {
  return chatPanelUtils.createStore();
}

describe('chat panel saved layout', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('docks left and closed by default', () => {
    const store = loadStore();
    expect(store.getState().mode).toBe('left');
    expect(store.getState().open).toBe(false);
  });

  it('remembers the side and width for every tab', () => {
    const store = loadStore();
    store.getState().dock('right');
    store.getState().setDockWidth(420);
    expect(JSON.parse(window.localStorage.getItem('chat-panel') ?? '')).toEqual(
      { mode: 'right', dockWidth: 420 },
    );
    window.sessionStorage.clear();
    const reloaded = loadStore();
    expect(reloaded.getState().mode).toBe('right');
    expect(reloaded.getState().dockWidth).toBe(420);
    expect(reloaded.getState().open).toBe(false);
  });

  it('keeps open per tab', () => {
    const store = loadStore();
    store.getState().setOpen(true);
    const reloaded = loadStore();
    expect(reloaded.getState().open).toBe(true);
  });
});

describe('chat panel conversation', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('token', userToken({ userId: 'user-a' }));
  });

  it('starts a new tab on the last chat', () => {
    window.localStorage.setItem('token', userToken({ userId: 'user-a' }));
    const store = loadStore();
    store.getState().conversationCreated('abc');
    window.sessionStorage.clear();
    const newTab = loadStore();
    expect(newTab.getState().conversationId).toBe('abc');
  });

  it('does not start another user on the last chat of the previous one', () => {
    window.localStorage.setItem('token', userToken({ userId: 'user-a' }));
    loadStore().getState().conversationCreated('chat-of-a');
    window.sessionStorage.clear();
    window.localStorage.setItem('token', userToken({ userId: 'user-b' }));
    const store = loadStore();
    expect(store.getState().conversationId).toBeNull();
  });

  it('does not open the chat of the previous user in the same tab', () => {
    loadStore().getState().conversationCreated('chat-of-a');
    window.localStorage.setItem('token', userToken({ userId: 'user-b' }));

    const store = loadStore();

    expect(store.getState().conversationId).toBeNull();
  });

  it('does not send another user back to the last page of the previous one', () => {
    loadStore().getState().setLastPage('/projects/p1/runs');
    window.localStorage.setItem('token', userToken({ userId: 'user-b' }));

    expect(loadStore().getState().lastPage).toBeNull();
  });

  it('keeps each tab on its own chat', () => {
    const store = loadStore();
    store.getState().conversationCreated('one');
    window.sessionStorage.setItem('chat:conv:platform-a:user-a', 'two');
    const otherTab = loadStore();
    expect(otherTab.getState().conversationId).toBe('two');
  });

  it('remembers a new chat in this tab', () => {
    const store = loadStore();
    store.getState().conversationCreated('one');
    store.getState().newChat('Hello');
    expect(store.getState().conversationId).toBeNull();
    expect(store.getState().newChatToken).toBe(1);
    expect(store.getState().pendingPrompt).toBe('Hello');
    const reloaded = loadStore();
    expect(reloaded.getState().conversationId).toBeNull();
  });

  it('forgets a missing chat', () => {
    const store = loadStore();
    store.getState().showConversation('gone');
    store.getState().conversationMissing();
    expect(store.getState().conversationId).toBeNull();
  });

  it('shows a chat and starts a new one', () => {
    const store = loadStore();
    store.getState().showConversation('abc');
    expect(store.getState().conversationId).toBe('abc');
    expect(store.getState().newChatToken).toBe(1);
    store.getState().showConversation(null);
    expect(store.getState().conversationId).toBeNull();
    expect(store.getState().newChatToken).toBe(2);
  });
});

function bind(hash: string) {
  const navigations: ChatNavTarget[] = [];
  const unbind = chatPanelUtils.bindRouter({
    navigate: (target) => navigations.push(target),
    location: () => ({
      pathname: '/projects/p1/automations',
      search: '',
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
      { to: '/projects/p1/tables/t1', replace: false },
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

describe('chatPanelUtils.openBeside without a chat router', () => {
  it('reports that it did not open, so links navigate normally', () => {
    expect(
      chatPanelUtils.openBeside({
        route: '/projects/p1/tables/t1',
        push: true,
        name: 'Leads',
      }),
    ).toBe(false);
  });

  it('reports that it opened when a chat router is bound', () => {
    const { unbind } = bind('');
    const opened = chatPanelUtils.openBeside({
      route: '/projects/p1/tables/t1',
      push: true,
      name: 'Leads',
    });
    unbind();

    expect(opened).toBe(true);
  });
});

describe('chatPanelUtils.openBeside on the same page', () => {
  it('keeps the sheet hash alone when the link has its own hash', () => {
    const { navigations, unbind } = bind(chatPanelUtils.SHEET_HASH);
    chatPanelUtils.openBeside({
      route: '/projects/p1/tables/t1#row-2',
      push: true,
      name: 'Leads',
    });
    unbind();

    expect(navigations).toEqual([
      { to: '/projects/p1/tables/t1', replace: false },
      { to: '/projects/p1/tables/t1#chat', replace: false },
    ]);
  });

  it('opens the same page with another query', () => {
    const { navigations, unbind } = bind('');
    chatPanelUtils.openBeside({
      route: '/projects/p1/automations?folder=f1',
      push: true,
      name: 'Folder',
    });
    unbind();

    expect(navigations).toEqual([
      { to: '/projects/p1/automations?folder=f1', replace: false },
    ]);
  });

  it('does nothing for the page already open', () => {
    const { navigations, unbind } = bind('');
    chatPanelUtils.openBeside({
      route: '/projects/p1/automations#top',
      push: true,
      name: 'Automations',
    });
    unbind();

    expect(navigations).toEqual([]);
  });
});

describe('chatPanelUtils.showOnFullPage', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the docked-chat mark when the full page swaps chats', () => {
    const navigations: ChatNavTarget[] = [];
    const unbind = chatPanelUtils.bindRouter({
      navigate: (target) => navigations.push(target),
      location: () => ({
        pathname: '/chat',
        search: '',
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
      location: () => ({ pathname: '/chat', search: '', hash: '', state }),
      isFullPage: () => true,
    });
    chatPanelUtils.showOnFullPage('c1');
    chatPanelUtils.collapse('right');
    unbind();

    expect(navigations.at(-1)).toEqual({ back: true });
  });
});

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

describe('chat panel on sign out', () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('token', userToken());
    window.localStorage.setItem(
      'chat:last-conv:platform-a:user-a',
      'conv-of-user-a',
    );
    window.sessionStorage.setItem(
      'chat:conv:platform-a:user-a',
      'conv-of-user-a',
    );
    window.sessionStorage.setItem(
      'chat:last-page:platform-a:user-a',
      '/projects/p1/runs',
    );
  });

  it('forgets the open chat and page of the signed out user', async () => {
    const { useChatPanel } = await import(
      '@/features/workspace/lib/chat-panel-open'
    );
    const { authenticationSession } = await import(
      '@/lib/authentication-session'
    );
    expect(useChatPanel.getState().conversationId).toBe('conv-of-user-a');

    authenticationSession.clearSession();

    expect(
      window.sessionStorage.getItem('chat:conv:platform-a:user-a'),
    ).toBeNull();
    expect(
      window.sessionStorage.getItem('chat:last-page:platform-a:user-a'),
    ).toBeNull();
    expect(useChatPanel.getState().conversationId).toBeNull();
    expect(useChatPanel.getState().lastPage).toBeNull();
  });

  it('keeps them while the user stays signed in', async () => {
    await import('@/features/workspace/lib/chat-panel-open');
    const { authenticationSession } = await import(
      '@/lib/authentication-session'
    );

    authenticationSession.switchToProject('p2');

    expect(
      window.localStorage.getItem('chat:last-conv:platform-a:user-a'),
    ).toBe('conv-of-user-a');
    expect(
      window.sessionStorage.getItem('chat:last-page:platform-a:user-a'),
    ).toBe('/projects/p1/runs');
  });
});

describe('chatPanelUtils.forgetConversation', () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('token', userToken());
  });

  it('stops a deleted chat from coming back in this tab or a new one', async () => {
    await openChat('conv-deleted');
    const { chatPanelUtils } = await panelModule();

    chatPanelUtils.forgetConversation('conv-deleted');

    expect(await reloadedConversationId()).toBeNull();
    window.sessionStorage.clear();
    expect(await reloadedConversationId()).toBeNull();
  });

  it('keeps the remembered chat when another chat is deleted', async () => {
    await openChat('conv-kept');
    const { chatPanelUtils } = await panelModule();

    chatPanelUtils.forgetConversation('conv-other');

    expect(await reloadedConversationId()).toBe('conv-kept');
    window.sessionStorage.clear();
    expect(await reloadedConversationId()).toBe('conv-kept');
  });
});

async function openChat(conversationId: string): Promise<void> {
  const { useChatPanel } = await panelModule();
  useChatPanel.getState().conversationCreated(conversationId);
}

async function reloadedConversationId(): Promise<string | null> {
  vi.resetModules();
  const { useChatPanel } = await panelModule();
  return useChatPanel.getState().conversationId;
}

function panelModule() {
  return import('@/features/workspace/lib/chat-panel-open');
}
