// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/query-client', () => ({
  queryClient: { invalidateQueries: vi.fn() },
}));

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

function userToken(): string {
  const encode = (value: object): string =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({ id: 'user-a', type: 'USER', platform: { id: 'platform-a' } }),
    'signature',
  ].join('.');
}
