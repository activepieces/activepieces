import { tryCatch } from '@activepieces/core-utils';
import { t } from 'i18next';
import { toast } from 'sonner';
import { create } from 'zustand';

import { chatApi } from './chat-api';

function removeWithUndo({
  id,
  onUndo,
  onSettled,
}: {
  id: string;
  onUndo?: () => void;
  onSettled?: () => void;
}): void {
  hide(id);
  let settled = false;
  const settle = () => {
    if (settled) return false;
    settled = true;
    window.removeEventListener('pagehide', commitOnExit);
    return true;
  };
  const commit = async () => {
    if (!settle()) return;
    const { error } = await tryCatch(() => chatApi.deleteConversation(id));
    if (error) toast.error(t('Failed to delete conversation'));
    show(id);
    onSettled?.();
  };
  const commitOnExit = () => {
    if (!settle()) return;
    chatApi.deleteConversationOnExit(id);
  };
  window.addEventListener('pagehide', commitOnExit);
  toast(t('Chat deleted'), {
    duration: UNDO_MS,
    action: {
      label: t('Undo'),
      onClick: () => {
        if (!settle()) return;
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
