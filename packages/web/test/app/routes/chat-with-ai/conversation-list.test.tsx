// @vitest-environment jsdom
import { AgentConversation, AgentRunSource } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ConversationList } from '@/app/routes/chat-with-ai/conversation-list';

const mocks = vi.hoisted(() => ({
  removeWithUndo: vi.fn(),
  deleteConversation: vi.fn(),
  listConversations: vi.fn(),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/app/components/settings-hub/settings-hub-dialog', () => ({
  SettingsHubDialog: () => null,
}));

vi.mock('@/features/chat/lib/use-conversation-indicators', () => ({
  useConversationIndicators: () => ({
    getIndicator: () => null,
    markRead: vi.fn(),
  }),
}));

vi.mock('@/features/chat/lib/chat-api', () => ({
  chatApi: {
    listConversations: mocks.listConversations,
    deleteConversation: mocks.deleteConversation,
  },
}));

vi.mock('@/features/chat/lib/chat-pending-deletes', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/features/chat/lib/chat-pending-deletes')
  >();
  return {
    ...actual,
    chatPendingDeletes: { removeWithUndo: mocks.removeWithUndo },
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ConversationList trash icon', () => {
  it('deletes with undo instead of deleting at once', async () => {
    mocks.listConversations.mockResolvedValue({
      data: [conversation('c1')],
      next: null,
      previous: null,
    });
    const onNewChat = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ConversationList selectedId="c1" onNewChat={onNewChat} />
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(mocks.removeWithUndo).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1' }),
    );
    expect(mocks.deleteConversation).not.toHaveBeenCalled();
    expect(onNewChat).toHaveBeenCalled();
  });
});

function conversation(id: string): AgentConversation {
  return AgentConversation.parse({
    id,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    platformId: 'platform-1',
    userId: 'user-1',
    source: AgentRunSource.CHAT,
    title: 'First chat',
  });
}
