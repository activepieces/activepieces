import { t } from 'i18next';
import { toast } from 'sonner';

import { api } from '@/lib/api';

export const INTERNAL_ERROR_MESSAGE =
  'An unexpected error occurred. Please try again in a moment.';

export const NETWORK_ERROR_MESSAGE =
  "Couldn't reach the server. Check your connection and try again.";

export const MUTATION_ERROR_TOAST_ID = 'mutation-error';

export const UNDO_TOAST_DURATION_MS = 8000;

const shownErrors = new WeakSet<object>();

function isNetworkError(error: unknown): boolean {
  return api.isError(error) && error.response === undefined;
}

function message(error: unknown): string {
  if (api.isError(error)) {
    const serverMessage = api.serverErrorMessage(error);
    if (serverMessage !== undefined) {
      return serverMessage;
    }
    const clientErrorMessage = topLevelClientErrorMessage({
      status: error.response?.status,
      data: error.response?.data,
    });
    if (clientErrorMessage !== undefined) {
      return clientErrorMessage;
    }
    return isNetworkError(error)
      ? t(NETWORK_ERROR_MESSAGE)
      : t(INTERNAL_ERROR_MESSAGE);
  }
  return api.extractServerErrorMessage(error, t(INTERNAL_ERROR_MESSAGE));
}

function topLevelClientErrorMessage({
  status,
  data,
}: {
  status: number | undefined;
  data: unknown;
}): string | undefined {
  const isClientError = status !== undefined && status >= 400 && status < 500;
  if (
    !isClientError ||
    typeof data !== 'object' ||
    data === null ||
    !('message' in data) ||
    typeof data.message !== 'string'
  ) {
    return undefined;
  }
  const trimmed = data.message.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function markShown(error: unknown): void {
  if (typeof error === 'object' && error !== null) {
    shownErrors.add(error);
  }
}

function wasShown(error: unknown): boolean {
  return typeof error === 'object' && error !== null && shownErrors.has(error);
}

function error({ error, title }: MutationErrorParams): void {
  markShown(error);
  toast.error(title ?? t('Something went wrong'), {
    id: MUTATION_ERROR_TOAST_ID,
    description: message(error),
  });
}

function undo({
  message,
  onUndo,
  undoneMessage,
}: UndoToastParams): string | number {
  return toast.success(message, {
    duration: UNDO_TOAST_DURATION_MS,
    action: {
      label: t('Undo'),
      onClick: () => {
        void runUndo({ onUndo, undoneMessage });
      },
    },
  });
}

async function runUndo({
  onUndo,
  undoneMessage,
}: Pick<UndoToastParams, 'onUndo' | 'undoneMessage'>): Promise<void> {
  try {
    await onUndo();
    toast.success(undoneMessage ?? t('Undone'));
  } catch (caught) {
    if (!wasShown(caught)) {
      error({ error: caught, title: t("Couldn't undo") });
    }
  }
}

export const mutationFeedback = {
  error,
  wasShown,
  markShown,
  message,
  isNetworkError,
  undo,
};

export type MutationErrorParams = {
  error: unknown;
  title?: string;
};

export type UndoToastParams = {
  message: string;
  onUndo: () => Promise<unknown> | unknown;
  undoneMessage?: string;
};
