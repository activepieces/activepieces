/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { chatApi } from '@/features/chat/lib/chat-api';
import { ChatStoreProvider } from '@/features/chat/lib/chat-store-context';
import { useAgentChat } from '@/features/chat/lib/use-chat';

vi.mock('@/components/providers/socket-provider', () => ({
  useSocket: () => ({ on: vi.fn(), off: vi.fn(), emit: vi.fn() }),
}));

vi.mock('@/features/chat/lib/chat-api', () => ({
  chatApi: {
    createConversation: vi.fn(
      (_request: unknown, signal?: AbortSignal) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    ),
    getConversation: vi.fn(async () => ({ id: 'conv-1' })),
    getMessages: vi.fn(async () => ({ data: [], next: null })),
    sendMessage: vi.fn(async () => undefined),
    cancelConversation: vi.fn(async () => undefined),
    getPendingGate: vi.fn(async () => null),
    getPickerConnections: vi.fn(async () => []),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAgentChat onSendAbandoned', () => {
  it('hands back a first message when a new chat starts before it is sent', async () => {
    const onSendAbandoned = vi.fn();
    const { result } = renderHook(() => useAgentChat({ onSendAbandoned }), {
      wrapper,
    });
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });

    let sending: Promise<void> = Promise.resolve();
    act(() => {
      sending = result.current.sendMessage('Build a flow', [file]);
    });
    await waitFor(() =>
      expect(chatApi.createConversation).toHaveBeenCalledTimes(1),
    );
    act(() => result.current.startNew());
    await act(() => sending);

    expect(onSendAbandoned).toHaveBeenCalledWith({
      content: 'Build a flow',
      files: [file],
      conversationId: null,
    });
    expect(chatApi.sendMessage).not.toHaveBeenCalled();
  });
});

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <ChatStoreProvider>{children}</ChatStoreProvider>
    </QueryClientProvider>
  );
}
