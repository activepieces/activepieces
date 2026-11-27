// @vitest-environment jsdom
import { AgentConversation, AgentRunSource } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatSwitcher } from '@/app/components/chat-panel/chat-switcher';

vi.mock('i18next', () => ({
  default: { language: 'en' },
  t: (key: string) => key,
}));

vi.mock('@/app/components/settings-hub/settings-hub-dialog', () => ({
  SettingsHubDialog: () => null,
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children }: React.PropsWithChildren) => <>{children}</>,
  PopoverTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  PopoverAnchor: () => null,
  PopoverContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/features/chat/lib/use-conversation-indicators', () => ({
  useConversationIndicators: () => ({
    getIndicator: () => 'unread',
    markRead: vi.fn(),
  }),
}));

vi.mock('@/features/chat/lib/chat-api', () => ({
  chatApi: {
    listConversations: vi
      .fn()
      .mockResolvedValue({ data: [conversation()], next: null }),
    getConversation: vi.fn().mockResolvedValue(conversation()),
    updateConversation: vi.fn(),
  },
}));

beforeEach(() => {
  Element.prototype.scrollIntoView = () => undefined;
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ChatSwitcher search', () => {
  it('lets Tab leave the search when nothing is there to jump to', async () => {
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <ChatSwitcher
          conversationId="c1"
          layout="dock"
          typing={false}
          open={true}
          openedBy="keyboard"
          onOpenChange={vi.fn()}
          onSelect={vi.fn()}
          onShowAll={vi.fn()}
          onTitleEdited={vi.fn()}
        />
      </QueryClientProvider>,
    );
    const search = await screen.findByPlaceholderText('Search chats');
    fireEvent.change(search, { target: { value: 'zzz' } });

    const kept = fireEvent.keyDown(search, { key: 'Tab' });

    expect(kept).toBe(true);
  });
});

function conversation(): AgentConversation {
  return AgentConversation.parse({
    id: 'c1',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    platformId: 'platform-1',
    userId: 'user-1',
    source: AgentRunSource.CHAT,
    title: 'Order lookup',
  });
}
