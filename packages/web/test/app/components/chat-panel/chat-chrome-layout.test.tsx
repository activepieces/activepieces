// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChatChrome } from '@/app/components/chat-panel/chat-chrome';
import { TooltipProvider } from '@/components/ui/tooltip';

const layout = vi.hoisted(() => ({ width: 'left' as string }));

vi.mock('i18next', () => ({
  default: { language: 'en' },
  t: (key: string) => key,
}));

vi.mock('@/app/components/chat-panel/chat-window', () => ({
  useChatWidth: () => layout.width,
  useActiveConversationId: () => null,
}));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { isEmbedded: false } }),
}));

vi.mock('@/app/routes/chat-with-ai/ai-chat-box', () => ({
  AIChatBox: () => <div>chat body</div>,
}));

vi.mock('@/app/components/chat-panel/chat-history-list', () => ({
  ChatHistoryList: () => <div>history list</div>,
}));

vi.mock('@/app/components/chat-panel/chat-switcher', () => ({
  ChatSwitcher: () => <div>chat title</div>,
}));

vi.mock('@/features/workspace/lib/chat-panel-open', () => {
  const state = {
    newChatToken: 0,
    pendingPrompt: undefined,
    mode: 'left',
    conversationId: null,
    setOpen: vi.fn(),
    showConversation: vi.fn(),
    conversationCreated: vi.fn(),
  };
  const useChatPanel = Object.assign(
    (select: (current: typeof state) => unknown) => select(state),
    { getState: () => state },
  );
  return {
    useChatPanel,
    chatPanelUtils: {
      startNewChat: vi.fn(),
      showOnFullPage: vi.fn(),
      expand: vi.fn(),
      collapse: vi.fn(),
    },
  };
});

function view() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>
        <ChatChrome />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe('ChatChrome', () => {
  it('keeps rendering when the chat moves from the dock to full page and back', () => {
    window.innerWidth = 1280;
    layout.width = 'left';
    const { rerender } = render(view());

    layout.width = 'full';
    rerender(view());
    layout.width = 'left';
    rerender(view());

    expect(screen.getByText('chat body')).toBeTruthy();
  });
});
