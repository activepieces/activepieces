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
  emitInProject: ({ send }: { send: () => void }) => send(),
  dropHeldEmits: () => undefined,
}));

vi.mock('@/features/chat/lib/chat-api', () => ({
  chatApi: {
    createConversation: vi.fn(async () => ({ id: 'conv-1' })),
    getConversation: vi.fn(async () => ({ id: 'conv-1' })),
    getMessages: vi.fn(async () => ({ data: [], next: null })),
    sendMessage: vi.fn(async () => {
      throw new Error('The model did not answer');
    }),
    cancelConversation: vi.fn(async () => undefined),
    getPendingGate: vi.fn(async () => null),
    getPickerConnections: vi.fn(async () => []),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAgentChat retryLastMessage', () => {
  it('resends the files of the last message', async () => {
    const { result } = renderHook(() => useAgentChat(), { wrapper });
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });

    await act(() => result.current.sendMessage('Summarise this file', [file]));
    await act(() => result.current.retryLastMessage('Summarise this file'));

    await waitFor(() => expect(sentFileNames()).toHaveLength(2));
    expect(sentFileNames()).toEqual([['notes.txt'], ['notes.txt']]);
  });

  it('retries the message that failed, not an older one from the transcript', async () => {
    const { result } = renderHook(() => useAgentChat(), { wrapper });
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });

    await act(() => result.current.sendMessage('New question', [file]));
    await act(() => result.current.retryLastMessage('Older question'));

    await waitFor(() => expect(sentContents()).toHaveLength(2));
    expect(sentContents()[1]).toBe('New question');
    expect(sentFileNames()[1]).toEqual(['notes.txt']);
  });

  it('retries a message that only had a file', async () => {
    const { result } = renderHook(() => useAgentChat(), { wrapper });
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });

    await act(() => result.current.sendMessage('', [file]));
    await act(() => result.current.retryLastMessage(''));

    await waitFor(() => expect(sentFileNames()).toHaveLength(2));
    expect(sentFileNames()[1]).toEqual(['notes.txt']);
  });
});

function sentContents(): string[] {
  return vi
    .mocked(chatApi.sendMessage)
    .mock.calls.map(([params]) => params.content);
}

function sentFileNames(): string[][] {
  return vi
    .mocked(chatApi.sendMessage)
    .mock.calls.map(([params]) => (params.files ?? []).map((f) => f.name));
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <ChatStoreProvider>{children}</ChatStoreProvider>
    </QueryClientProvider>
  );
}
