// @vitest-environment jsdom
import {
  AgentConversation,
  AgentRunSource,
  SeekPage,
} from '@activepieces/shared';
import { InfiniteData, QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { chatApi } from '@/features/chat/lib/chat-api';
import {
  chatPendingDeletes,
  usePendingDeletes,
} from '@/features/chat/lib/chat-pending-deletes';
import { chatQueryKeys } from '@/features/chat/lib/chat-query-keys';

const toasts = vi.hoisted(() => {
  const shown: ToastOptions[] = [];
  return { shown, error: vi.fn() };
});

const panel = vi.hoisted(() => ({ forgetConversation: vi.fn() }));

vi.mock('@/features/workspace/lib/chat-panel-open', () => ({
  chatPanelUtils: { forgetConversation: panel.forgetConversation },
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('sonner', () => ({
  toast: Object.assign(
    (...args: [string, ToastOptions]) => {
      toasts.shown.push(args[1]);
    },
    { error: toasts.error },
  ),
}));

vi.mock('@/features/chat/lib/chat-api', () => ({
  chatApi: { deleteConversation: vi.fn(), deleteConversationOnExit: vi.fn() },
}));

describe('chatPendingDeletes.removeWithUndo', () => {
  afterEach(() => {
    vi.clearAllMocks();
    toasts.shown.length = 0;
  });

  it('says so and gives the chat back when the delete fails', async () => {
    vi.mocked(chatApi.deleteConversation).mockRejectedValue(new Error('x'));
    const onFailed = vi.fn();
    const onDeleted = vi.fn();
    chatPendingDeletes.removeWithUndo({
      queryClient: new QueryClient(),
      id: 'c1',
      onFailed,
      onDeleted,
    });

    toasts.shown.at(-1)?.onAutoClose?.();

    await vi.waitFor(() => expect(onFailed).toHaveBeenCalled());
    expect(onDeleted).not.toHaveBeenCalled();
    expect(panel.forgetConversation).not.toHaveBeenCalled();
    expect(toasts.error).toHaveBeenCalledWith('Failed to delete conversation');
    expect(usePendingDeletes.getState().ids.has('c1')).toBe(false);
  });

  it('reports a delete that went through', async () => {
    vi.mocked(chatApi.deleteConversation).mockResolvedValue(undefined);
    const onFailed = vi.fn();
    const onDeleted = vi.fn();
    chatPendingDeletes.removeWithUndo({
      queryClient: new QueryClient(),
      id: 'c2',
      onFailed,
      onDeleted,
    });

    toasts.shown.at(-1)?.onAutoClose?.();

    await vi.waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(onFailed).not.toHaveBeenCalled();
    expect(panel.forgetConversation).toHaveBeenCalledWith('c2');
  });

  it('forgets the chat when the tab closes before the delete settles', () => {
    chatPendingDeletes.removeWithUndo({
      queryClient: new QueryClient(),
      id: 'c5',
    });

    window.dispatchEvent(new Event('pagehide'));

    expect(chatApi.deleteConversationOnExit).toHaveBeenCalledWith('c5');
    expect(panel.forgetConversation).toHaveBeenCalledWith('c5');
  });
});

describe('chatPendingDeletes.removeWithUndo after the delete', () => {
  afterEach(() => {
    vi.clearAllMocks();
    toasts.shown.length = 0;
  });

  it('drops the row from the cached history before un-hiding it', async () => {
    vi.mocked(chatApi.deleteConversation).mockResolvedValue(undefined);
    const queryClient = new QueryClient();
    const listKey = chatQueryKeys.conversationList();
    queryClient.setQueryData(listKey, history(['c3', 'c4']));
    const listedWhenShown: string[][] = [];
    const stop = usePendingDeletes.subscribe((state, previous) => {
      if (previous.ids.has('c3') && !state.ids.has('c3')) {
        listedWhenShown.push(idsIn(queryClient.getQueryData(listKey)));
      }
    });
    const onDeleted = vi.fn();
    chatPendingDeletes.removeWithUndo({ queryClient, id: 'c3', onDeleted });

    toasts.shown.at(-1)?.onAutoClose?.();

    await vi.waitFor(() => expect(onDeleted).toHaveBeenCalled());
    stop();
    expect(listedWhenShown).toEqual([['c4']]);
  });
});

function history(ids: string[]): InfiniteData<SeekPage<AgentConversation>> {
  return {
    pageParams: [undefined],
    pages: [
      {
        next: null,
        previous: null,
        data: ids.map((id) => conversationWith(id)),
      },
    ],
  };
}

function conversationWith(id: string): AgentConversation {
  return AgentConversation.parse({
    id,
    created: '2026-11-03T10:00:00.000Z',
    updated: '2026-11-03T10:00:00.000Z',
    platformId: 'platform-1',
    userId: 'user-1',
    source: AgentRunSource.CHAT,
  });
}

function idsIn(data: unknown): string[] {
  if (!isHistory(data)) return [];
  return data.pages.flatMap((page) => page.data.map((c) => c.id));
}

function isHistory(
  data: unknown,
): data is InfiniteData<SeekPage<AgentConversation>> {
  return typeof data === 'object' && data !== null && 'pages' in data;
}

type ToastOptions = { onAutoClose?: () => void };
