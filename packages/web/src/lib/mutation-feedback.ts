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
    return internalErrorText();
  }
  const serverMessage = api.serverErrorMessage(error);
  if (serverMessage !== undefined && !isGenericServerMessage(error)) {
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
  return isNetworkError(error) ? networkErrorText() : internalErrorText();
}

function isGenericServerMessage(error: unknown): boolean {
  if (api.isApError(error, ErrorCode.AUTHORIZATION)) {
    return true;
  }
  return (
    api.isApError(error, ErrorCode.FEATURE_DISABLED) &&
    api.serverErrorMessage(error) === GENERIC_FEATURE_DISABLED_MESSAGE
  );
}

function internalErrorText(): string {
  return t('An unexpected error occurred. Please try again in a moment.');
}

function networkErrorText(): string {
  return t("Couldn't reach the server. Check your connection and try again.");
}

function validationErrorText(): string {
  return t("Some values aren't valid. Check them and try again.");
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
  return isSchemaValidation ? validationErrorText() : data.message.trim();
}

function messageOr({
  error,
  fallback,
}: {
  error: unknown;
  fallback: string;
}): string {
  const text = message(error);
  return text === internalErrorText() ? fallback : text;
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

function error(params: MutationErrorParams): void {
  const { error } = params;
  markShown(error);
  if (typeof error !== 'object' || error === null) {
    report(params);
    return;
  }
  const timer = setTimeout(() => {
    pendingReports.delete(error);
    report(params);
  }, 0);
  pendingReports.set(error, { params, timer });
}

function report({ error, title, description }: MutationErrorParams): void {
  if (isQuotaExceeded(error)) {
    openPlanDialog();
    return;
  }
  toast.error(title ?? t('Something went wrong'), {
    description: description ?? message(error),
  });
}

function claimReport(error: unknown): MutationErrorParams | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  const pending = pendingReports.get(error);
  if (pending === undefined) {
    return undefined;
  }
  clearTimeout(pending.timer);
  pendingReports.delete(error);
  return pending.params;
}

function success(message: ReactNode, description?: string): void {
  toast.success(message, { description });
}

function undo(params: UndoToastParams): string | number {
  const { message, id } = params;
  return toast.success(message, {
    ...(id === undefined ? {} : { id }),
    duration: UNDO_TOAST_DURATION_MS,
    action: {
      label: t('Undo'),
      onClick: () => {
        runUndo(params).catch(() => undefined);
      },
    },
  });
}

async function runUndo(params: UndoToastParams): Promise<void> {
  const { onUndo, undoneMessage } = params;
  try {
    await onUndo();
    toast.success(undoneMessage ?? t('Undone'));
  } catch (caught) {
    if (isUserFacingError(caught) && !wasShown(caught)) {
      markShown(caught);
      toast.error(t("Couldn't undo"), { description: caught.message });
      undo({ ...params, id: retryUndoId(params.id) });
      return;
    }
    if (isQuotaExceeded(caught)) {
      if (!wasShown(caught)) {
        openPlanDialog();
      }
      markShown(caught);
      toast.error(t("Couldn't undo"), {
        description: t("You've reached your plan's limit."),
      });
      return;
    }
    if (!wasShown(caught)) {
      error({ error: caught, title: t("Couldn't undo") });
    }
  }
}

function retryUndoId(id: string | undefined): string | undefined {
  undoRetryCount += 1;
  return id === undefined ? undefined : `${id}:retry-${undoRetryCount}`;
}

async function parseBlobError(error: unknown): Promise<void> {
  if (!api.isError(error) || error.response === undefined) {
    return;
  }
  const response = error.response;
  const data = response.data;
  if (!(data instanceof Blob)) {
    return;
  }
  try {
    const parsed: unknown = JSON.parse(await data.text());
    response.data = parsed;
  } catch {
    return;
  }
}

async function runConfirm({
  run,
  canShowInline,
}: {
  run: () => Promise<unknown> | unknown;
  canShowInline: () => boolean;
}): Promise<ConfirmFailure | null> {
  try {
    await run();
    return null;
  } catch (caught) {
    if (!canShowInline()) {
      if (!wasShown(caught)) {
        error({ error: caught });
      }
      return { error: caught, description: message(caught) };
    }
    const claimed = claimReport(caught);
    markShown(caught);
    return {
      error: caught,
      title: claimed?.title,
      description: claimed?.description ?? message(caught),
    };
  }
}

const pendingReports = new WeakMap<
  object,
  { params: MutationErrorParams; timer: ReturnType<typeof setTimeout> }
>();

const shownErrors = new WeakSet<object>();

let undoRetryCount = 0;

function isQuotaExceeded(error: unknown): boolean {
  return api.isApError(error, ErrorCode.QUOTA_EXCEEDED);
}

function openPlanDialog(): void {
  window.dispatchEvent(new Event(PLAN_LIMIT_EVENT));
}
const userFacingErrors = new WeakSet<Error>();

const GENERIC_FEATURE_DISABLED_MESSAGE = 'Feature is disabled';

export const PLAN_LIMIT_EVENT = 'ap:admin-plan-limit';

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
  runConfirm,
  isNetworkError,
  undo,
  parseBlobError,
};

export type ConfirmFailure = {
  error: unknown;
  title?: string;
  description: string;
};

export type MutationErrorParams = {
  error: unknown;
  title?: string;
  description?: string;
};

export type UndoToastParams = {
  message: string;
  id?: string;
  onUndo: () => Promise<unknown> | unknown;
  undoneMessage?: string;
};
