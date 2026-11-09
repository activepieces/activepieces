// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { chatApi } from '@/features/chat/lib/chat-api';
import {
  chatPendingDeletes,
  usePendingDeletes,
} from '@/features/chat/lib/chat-pending-deletes';

const toasts = vi.hoisted(() => {
  const shown: ToastOptions[] = [];
  return { shown, error: vi.fn() };
});

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
    chatPendingDeletes.removeWithUndo({ id: 'c1', onFailed, onDeleted });

    toasts.shown.at(-1)?.onAutoClose?.();

    await vi.waitFor(() => expect(onFailed).toHaveBeenCalled());
    expect(onDeleted).not.toHaveBeenCalled();
    expect(toasts.error).toHaveBeenCalledWith('Failed to delete conversation');
    expect(usePendingDeletes.getState().ids.has('c1')).toBe(false);
  });

  it('reports a delete that went through', async () => {
    vi.mocked(chatApi.deleteConversation).mockResolvedValue(undefined);
    const onFailed = vi.fn();
    const onDeleted = vi.fn();
    chatPendingDeletes.removeWithUndo({ id: 'c2', onFailed, onDeleted });

    toasts.shown.at(-1)?.onAutoClose?.();

    await vi.waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(onFailed).not.toHaveBeenCalled();
  });
});

type ToastOptions = { onAutoClose?: () => void };
