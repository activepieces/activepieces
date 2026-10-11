import { t } from 'i18next';
import { toast } from 'sonner';

import { INTERNAL_ERROR_MESSAGE } from '@/components/ui/sonner';
import { api } from '@/lib/api';

function isNetworkError(error: unknown): boolean {
  return api.isError(error) && error.response === undefined;
}

function message(error: unknown): string {
  if (isUserFacingError(error)) {
    return error.message;
  }
  if (api.isError(error)) {
    const serverMessage = api.serverErrorMessage(error);
    if (serverMessage !== undefined) {
      return serverMessage;
    }
    return isNetworkError(error)
      ? t(NETWORK_ERROR_MESSAGE)
      : t(INTERNAL_ERROR_MESSAGE);
  }
  return t(INTERNAL_ERROR_MESSAGE);
}

function userError(text: string): Error {
  const error = new Error(text);
  userFacingErrors.add(error);
  return error;
}

function isUserFacingError(error: unknown): error is Error {
  return error instanceof Error && userFacingErrors.has(error);
}

function markShown(error: unknown): void {
  if (typeof error === 'object' && error !== null) {
    shownErrors.add(error);
  }
}

function wasShown(error: unknown): boolean {
  return typeof error === 'object' && error !== null && shownErrors.has(error);
}

function error({ error, title, description }: MutationErrorParams): void {
  markShown(error);
  toast.error(title ?? t('Something went wrong'), {
    id: MUTATION_ERROR_TOAST_ID,
    description: description ?? message(error),
  });
}

function success(message: string, description?: string): void {
  toast.success(message, { description });
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
        runUndo({ onUndo, undoneMessage }).catch(() => undefined);
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

const shownErrors = new WeakSet<object>();
const userFacingErrors = new WeakSet<Error>();

export const NETWORK_ERROR_MESSAGE =
  "Couldn't reach the server. Check your connection and try again.";

export const MUTATION_ERROR_TOAST_ID = 'mutation-error';

export const UNDO_TOAST_DURATION_MS = 8000;

export const mutationFeedback = {
  success,
  error,
  wasShown,
  markShown,
  message,
  userError,
  isNetworkError,
  undo,
};

export type MutationErrorParams = {
  error: unknown;
  title?: string;
  description?: string;
};

export type UndoToastParams = {
  message: string;
  onUndo: () => Promise<unknown> | unknown;
  undoneMessage?: string;
};
