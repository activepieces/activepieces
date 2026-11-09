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
  });

  it('starts a new tab on the last chat', () => {
    window.localStorage.setItem('chat:last-conv', 'abc');
    const store = loadStore();
    expect(store.getState().conversationId).toBe('abc');
  });

  it('keeps each tab on its own chat', () => {
    const store = loadStore();
    store.getState().conversationCreated('one');
    window.sessionStorage.setItem('chat:conv', 'two');
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
