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
    getConversation: vi.fn(async () => ({ id: 'conv-1' })),
    getMessages: vi.fn(),
    cancelConversation: vi.fn(async () => undefined),
    getPendingGate: vi.fn(async () => null),
    getPickerConnections: vi.fn(async () => []),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAgentChat history load', () => {
  it('offers a retry, not "not found", when the history fails to load', async () => {
    vi.mocked(chatApi.getMessages).mockRejectedValueOnce(new Error('offline'));
    const onConversationMissing = vi.fn();
    const { result } = renderHook(
      () => useAgentChat({ onConversationMissing }),
      { wrapper },
    );

    await act(() => result.current.setConversationId('conv-1'));

    expect(result.current.historyFailed).toBe(true);
    expect(result.current.error).toBeNull();
    expect(onConversationMissing).not.toHaveBeenCalled();
  });

  it('keeps the chat it failed to load, so a reply cannot start a new chat', async () => {
    vi.mocked(chatApi.getMessages).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useAgentChat(), { wrapper });

    await act(() => result.current.setConversationId('conv-1'));

    expect(result.current.historyFailed).toBe(true);
    expect(result.current.conversationId).toBe('conv-1');
  });

  it('loads the chat on retry', async () => {
    vi.mocked(chatApi.getMessages)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: [] });
    const { result } = renderHook(() => useAgentChat(), { wrapper });
    await act(() => result.current.setConversationId('conv-1'));

    await act(() => result.current.reloadHistory());

    await waitFor(() => expect(result.current.historyFailed).toBe(false));
    expect(result.current.conversationId).toBe('conv-1');
    expect(chatApi.getMessages).toHaveBeenCalledTimes(2);
  });
});

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <ChatStoreProvider>{children}</ChatStoreProvider>
    </QueryClientProvider>
  );
}
