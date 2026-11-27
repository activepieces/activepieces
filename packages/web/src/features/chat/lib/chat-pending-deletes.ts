import { tryCatch } from '@activepieces/core-utils';
import { AgentConversation, SeekPage } from '@activepieces/shared';
import { InfiniteData, QueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';
import { create } from 'zustand';

import { chatPanelUtils } from '@/features/workspace/lib/chat-panel-open';

import { chatApi } from './chat-api';
import { chatQueryKeys } from './chat-query-keys';

function removeWithUndo({
  queryClient,
  id,
  onUndo,
  onDeleted,
  onFailed,
}: {
  queryClient: QueryClient;
  id: string;
  onUndo?: () => void;
  onDeleted?: () => void;
  onFailed?: () => void;
}): void {
  hide(id);
  let settled = false;
  let sending = false;
  const settle = () => {
    if (settled) return false;
    settled = true;
    window.removeEventListener('pagehide', commitOnExit);
    return true;
  };
  const commit = async () => {
    if (settled || sending) return;
    sending = true;
    const { error } = await tryCatch(() => chatApi.deleteConversation(id));
    if (!settle()) return;
    if (error) {
      show(id);
      toast.error(t('Failed to delete conversation'));
      onFailed?.();
      return;
    }
    chatPanelUtils.forgetConversation(id);
    dropFromLists({ queryClient, id });
    queryClient.removeQueries({ queryKey: chatQueryKeys.conversation(id) });
    show(id);
    onDeleted?.();
    queryClient
      .invalidateQueries({ queryKey: chatQueryKeys.allConversationLists() })
      .catch(() => undefined);
  };
  const commitOnExit = () => {
    if (!settle()) return;
    chatApi.deleteConversationOnExit(id);
    chatPanelUtils.forgetConversation(id);
  };
  window.addEventListener('pagehide', commitOnExit);
  toast(t('Chat deleted'), {
    duration: UNDO_MS,
    action: {
      label: t('Undo'),
      onClick: () => {
        if (sending || !settle()) return;
        show(id);
        onUndo?.();
      },
    },
    onAutoClose: () => {
      commit().catch(() => undefined);
    },
    onDismiss: () => {
      commit().catch(() => undefined);
    },
  });
}

function dropFromLists({
  queryClient,
  id,
}: {
  queryClient: QueryClient;
  id: string;
}): void {
  queryClient.setQueriesData<InfiniteData<SeekPage<AgentConversation>>>(
    { queryKey: chatQueryKeys.allConversationLists() },
    (lists) =>
      lists && {
        ...lists,
        pages: lists.pages.map((page) => ({
          ...page,
          data: page.data.filter((conversation) => conversation.id !== id),
        })),
      },
  );
}

function hide(id: string) {
  usePendingDeletes.setState(({ ids }) => ({ ids: new Set(ids).add(id) }));
}

function show(id: string) {
  usePendingDeletes.setState(({ ids }) => {
    if (!ids.has(id)) return { ids };
    const next = new Set(ids);
    next.delete(id);
    return { ids: next };
  });
}

const UNDO_MS = 5000;

export const usePendingDeletes = create<{ ids: Set<string> }>(() => ({
  ids: new Set(),
}));

export const chatPendingDeletes = {
  removeWithUndo,
};
