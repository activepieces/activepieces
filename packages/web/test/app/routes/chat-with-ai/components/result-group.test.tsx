/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AssistantMessage } from '@/app/routes/chat-with-ai/components/assistant-message';
import { MessageBlock } from '@/app/routes/chat-with-ai/lib/message-blocks';
import { ToolCallMeta } from '@/features/chat/lib/chat-store';
import {
  ChatStoreProvider,
  useChatStoreApi,
} from '@/features/chat/lib/chat-store-context';
import { ChatUIMessage } from '@/features/chat/lib/chat-types';

const fixture = vi.hoisted(() => {
  const value: { blocks: MessageBlock[] } = { blocks: [] };
  return value;
});

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));
vi.mock(
  '@/app/routes/chat-with-ai/lib/message-blocks',
  async (importOriginal) => ({
    ...(await importOriginal<object>()),
    buildMessageBlocks: () => ({
      blocks: fixture.blocks,
      hasContent: true,
      sources: [],
    }),
  }),
);
vi.mock('@/features/pieces/hooks/pieces-hooks', () => ({
  piecesHooks: {
    usePieceSummary: () => ({ summary: undefined }),
    usePieceSummariesByNames: () => ({
      summaries: [{ displayName: 'Gmail' }, { displayName: 'Slack' }],
    }),
  },
}));

afterEach(() => {
  cleanup();
});

describe('Result group', () => {
  it('folds a run of results into one card that opens to its rows', () => {
    fixture.blocks = [
      {
        kind: 'card-group',
        cards: [
          { kind: 'action-receipt', toolCallId: 'tc-1' },
          { kind: 'action-receipt', toolCallId: 'tc-2' },
        ],
      },
    ];
    renderMessage();

    expect(screen.getByText('chatOutcomeCount {"count":2}')).toBeTruthy();
    expect(screen.getByText('Gmail, Slack')).toBeTruthy();
    expect(
      screen.getByText(
        '{count, plural, =1 {1 failed} other {# failed}} {"count":1}',
      ),
    ).toBeTruthy();
    expect(screen.queryByText('Sent the welcome email')).toBe(null);

    fireEvent.click(screen.getAllByRole('button', { name: 'Show details' })[0]);

    expect(screen.getByText('Sent the welcome email')).toBeTruthy();
    expect(screen.getByText('Post message')).toBeTruthy();
  });

  it('titles a single result with its doneTitle, else the action name', () => {
    fixture.blocks = [
      { kind: 'action-receipt', toolCallId: 'tc-1' },
      { kind: 'action-receipt', toolCallId: 'tc-2' },
    ];
    renderMessage();

    expect(screen.getByText('Sent the welcome email')).toBeTruthy();
    expect(screen.queryByText('Send email')).toBe(null);
    expect(screen.getByText('Post message')).toBeTruthy();
  });
});

function renderMessage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ChatStoreProvider>
          <SeedStore />
          <AssistantMessage
            message={MESSAGE}
            isStreaming={false}
            messageIndex={1}
          />
        </ChatStoreProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function SeedStore() {
  const store = useChatStoreApi();
  useState(() => {
    store.setState({ toolCallMeta: TOOL_CALL_META });
    return true;
  });
  return null;
}

const TIMESTAMP = '2026-11-08T10:00:00.000Z';

const TOOL_CALL_META: Record<string, ToolCallMeta> = {
  'tc-1': {
    actionReceipt: {
      toolCallId: 'tc-1',
      actionDisplayName: 'Send email',
      pieceName: '@activepieces/piece-gmail',
      status: 'success',
      output: { id: 'm1' },
      timestamp: TIMESTAMP,
    },
  },
  'tc-2': {
    actionReceipt: {
      toolCallId: 'tc-2',
      actionDisplayName: 'Post message',
      pieceName: '@activepieces/piece-slack',
      status: 'failed',
      output: null,
      errorMessage: 'not_in_channel',
      timestamp: TIMESTAMP,
    },
  },
};

const MESSAGE: ChatUIMessage = {
  id: 'hist-1',
  role: 'assistant',
  parts: [
    {
      type: 'dynamic-tool',
      toolName: 'ap_execute_action',
      toolCallId: 'tc-1',
      state: 'output-available',
      input: { doneTitle: 'Sent the welcome email' },
      output: {},
    },
    {
      type: 'dynamic-tool',
      toolName: 'ap_execute_action',
      toolCallId: 'tc-2',
      state: 'output-available',
      input: {},
      output: {},
    },
  ],
};
