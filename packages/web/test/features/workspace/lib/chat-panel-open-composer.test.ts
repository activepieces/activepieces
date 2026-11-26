// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { chatPanelUtils } from '@/features/workspace/lib/chat-panel-open';

describe('chat panel conversation', () => {
  it('starts a fresh composer when another chat is shown', () => {
    const store = chatPanelUtils.createStore();
    store.getState().showConversation('chat-a');
    const tokenForA = store.getState().newChatToken;

    store.getState().showConversation('chat-b');

    expect(store.getState().conversationId).toBe('chat-b');
    expect(store.getState().newChatToken).toBe(tokenForA + 1);
  });

  it('keeps the composer when the same chat is shown again', () => {
    const store = chatPanelUtils.createStore();
    store.getState().showConversation('chat-a');
    const tokenForA = store.getState().newChatToken;

    store.getState().showConversation('chat-a');

    expect(store.getState().newChatToken).toBe(tokenForA);
  });

  it('keeps the composer when a new chat gets its id', () => {
    const store = chatPanelUtils.createStore();
    store.getState().newChat();
    const token = store.getState().newChatToken;

    store.getState().conversationCreated('chat-new');

    expect(store.getState().conversationId).toBe('chat-new');
    expect(store.getState().newChatToken).toBe(token);
  });
});
