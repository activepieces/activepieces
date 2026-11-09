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

  it('keeps each tab on its own chat', () => {
    const store = loadStore();
    store.getState().conversationCreated('one');
    window.sessionStorage.setItem('chat:conv', 'two');
    const otherTab = loadStore();
    expect(otherTab.getState().conversationId).toBe('two');
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
