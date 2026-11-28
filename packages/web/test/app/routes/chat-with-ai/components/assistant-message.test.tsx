// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AssistantMessage } from '@/app/routes/chat-with-ai/components/assistant-message';
import { ChatStoreProvider } from '@/features/chat/lib/chat-store-context';
import { ChatUIMessage } from '@/features/chat/lib/chat-types';

vi.mock('i18next', () => ({
  default: { language: 'en' },
  t: (key: string) => key,
}));

afterEach(cleanup);

describe('AssistantMessage', () => {
  it('still shows a memory request that expired while waiting', () => {
    const message: ChatUIMessage = {
      id: 'm1',
      role: 'assistant',
      parts: [
        {
          type: 'tool-ap_remember',
          toolCallId: 'call-1',
          state: 'output-available',
          input: {},
          output: { saved: false, timedOut: true },
        },
      ],
    };

    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <ChatStoreProvider>
            <AssistantMessage
              message={message}
              isStreaming={false}
              isLastMessage
              messageIndex={0}
            />
          </ChatStoreProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(container.textContent).toContain('This request expired.');
  });
});
