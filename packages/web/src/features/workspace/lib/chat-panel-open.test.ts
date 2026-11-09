// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadStore() {
  vi.resetModules();
  const { useChatPanel } = await import('./chat-panel-open');
  return useChatPanel;
}

describe('chat panel saved layout', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('docks left and closed by default', async () => {
    const store = await loadStore();
    expect(store.getState().mode).toBe('left');
    expect(store.getState().open).toBe(false);
  });

  it('remembers the side and width for every tab', async () => {
    const store = await loadStore();
    store.getState().dock('right');
    store.getState().setDockWidth(420);
    expect(JSON.parse(window.localStorage.getItem('chat-panel') ?? '')).toEqual(
      { mode: 'right', dockWidth: 420 },
    );
    window.sessionStorage.clear();
    const reloaded = await loadStore();
    expect(reloaded.getState().mode).toBe('right');
    expect(reloaded.getState().dockWidth).toBe(420);
    expect(reloaded.getState().open).toBe(false);
  });

  it('keeps open per tab', async () => {
    const store = await loadStore();
    store.getState().setOpen(true);
    const reloaded = await loadStore();
    expect(reloaded.getState().open).toBe(true);
  });
});

describe('chat panel conversation', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('starts a new tab on the last chat', async () => {
    window.localStorage.setItem('chat:last-conv', 'abc');
    const store = await loadStore();
    expect(store.getState().conversationId).toBe('abc');
  });

  it('keeps each tab on its own chat', async () => {
    const store = await loadStore();
    store.getState().conversationCreated('one');
    window.sessionStorage.setItem('chat:conv', 'two');
    const otherTab = await loadStore();
    expect(otherTab.getState().conversationId).toBe('two');
  });

  it('remembers a new chat in this tab', async () => {
    const store = await loadStore();
    store.getState().conversationCreated('one');
    store.getState().newChat('Hello');
    expect(store.getState().conversationId).toBeNull();
    expect(store.getState().newChatToken).toBe(1);
    expect(store.getState().pendingPrompt).toBe('Hello');
    const reloaded = await loadStore();
    expect(reloaded.getState().conversationId).toBeNull();
  });

  it('forgets a missing chat', async () => {
    const store = await loadStore();
    store.getState().showConversation('gone');
    store.getState().conversationMissing();
    expect(store.getState().conversationId).toBeNull();
  });

  it('follows the chat page URL', async () => {
    const store = await loadStore();
    store.getState().showConversation('abc');
    expect(store.getState().conversationId).toBe('abc');
    expect(store.getState().newChatToken).toBe(0);
    store.getState().showConversation(null);
    expect(store.getState().conversationId).toBeNull();
    expect(store.getState().newChatToken).toBe(1);
  });
});
