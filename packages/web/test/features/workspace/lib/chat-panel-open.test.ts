// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { chatPanelUtils } from '@/features/workspace/lib/chat-panel-open';

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

  it('follows the chat page URL', () => {
    const store = loadStore();
    store.getState().showConversation('abc');
    expect(store.getState().conversationId).toBe('abc');
    expect(store.getState().newChatToken).toBe(0);
    store.getState().showConversation(null);
    expect(store.getState().conversationId).toBeNull();
    expect(store.getState().newChatToken).toBe(1);
  });
});

function userToken({ userId }: { userId: string }): string {
  const encode = (value: object): string =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({ id: userId, type: 'USER', platform: { id: 'platform-a' } }),
    'signature',
  ].join('.');
}
