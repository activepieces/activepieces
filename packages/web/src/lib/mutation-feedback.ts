import { ErrorCode } from '@activepieces/core-utils';
import { t } from 'i18next';
import { ReactNode } from 'react';
import { toast } from 'sonner';

import { api } from '@/lib/api';

function isNetworkError(error: unknown): boolean {
  return api.isError(error) && error.response === undefined;
}

function message(error: unknown): string {
  if (isUserFacingError(error)) {
    return error.message;
  }
  if (!api.isError(error)) {
    return t(INTERNAL_ERROR_MESSAGE);
  }
  const serverMessage = api.serverErrorMessage(error);
  if (serverMessage !== undefined) {
    return serverMessage;
  }
  const known = knownCodeMessage(error);
  if (known !== undefined) {
    return known;
  }
  const clientMessage = clientErrorMessage({
    status: error.response?.status,
    data: error.response?.data,
  });
  if (clientMessage !== undefined) {
    return clientMessage;
  }
  return isNetworkError(error)
    ? t(NETWORK_ERROR_MESSAGE)
    : t(INTERNAL_ERROR_MESSAGE);
}

function knownCodeMessage(error: unknown): string | undefined {
  if (
    api.isApError(error, ErrorCode.PERMISSION_DENIED) ||
    api.isApError(error, ErrorCode.AUTHORIZATION)
  ) {
    return t("You don't have permission to do this.");
  }
  if (api.isApError(error, ErrorCode.ENTITY_NOT_FOUND)) {
    return t('It no longer exists. Refresh the page and try again.');
  }
  if (api.isApError(error, ErrorCode.FEATURE_DISABLED)) {
    return t("Your plan doesn't include this feature.");
  }
  return undefined;
}

function clientErrorMessage({
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
    typeof data.message !== 'string' ||
    data.message.trim().length === 0
  ) {
    return undefined;
  }
  const isSchemaValidation =
    'code' in data &&
    typeof data.code === 'string' &&
    data.code.startsWith('FST_');
  return isSchemaValidation ? t(VALIDATION_ERROR_MESSAGE) : data.message.trim();
}

function messageOr({
  error,
  fallback,
}: {
  error: unknown;
  fallback: string;
}): string {
  const text = message(error);
  return text === t(INTERNAL_ERROR_MESSAGE) ? fallback : text;
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
  if (isQuotaExceeded(error)) {
    openPlanDialog();
    return;
  }
  toast.error(title ?? t('Something went wrong'), {
    description: description ?? message(error),
  });
}

function success(message: ReactNode, description?: string): void {
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

function isQuotaExceeded(error: unknown): boolean {
  return api.isApError(error, ErrorCode.QUOTA_EXCEEDED);
}

function openPlanDialog(): void {
  window.dispatchEvent(new Event(PLAN_LIMIT_EVENT));
}
const userFacingErrors = new WeakSet<Error>();

export const PLAN_LIMIT_EVENT = 'ap:admin-plan-limit';

export const INTERNAL_ERROR_MESSAGE =
  'An unexpected error occurred. Please try again in a moment.';

export const VALIDATION_ERROR_MESSAGE =
  "Some values aren't valid. Check them and try again.";

export const NETWORK_ERROR_MESSAGE =
  "Couldn't reach the server. Check your connection and try again.";

export const UNDO_TOAST_DURATION_MS = 8000;

export const mutationFeedback = {
  success,
  error,
  isQuotaExceeded,
  wasShown,
  markShown,
  message,
  messageOr,
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
