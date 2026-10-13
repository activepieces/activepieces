import {
  MutationKey,
  QueryKey,
  useMutation,
  useQueryClient,
  UseMutationResult,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { useId } from 'react';
import { toast } from 'sonner';

import { mutationFeedback } from '@/lib/mutation-feedback';

export function useAdminAction<TVars = void, TData = unknown>({
  verb,
  name = '',
  run,
  invalidate = [],
  onSuccess,
  undo,
  feedback = 'toast',
  handleError,
  messages,
  mutationKey,
}: AdminActionConfig<TVars, TData>): UseMutationResult<TData, Error, TVars> {
  const queryClient = useQueryClient();
  const actionId = useId();
  const nameOf = (vars: TVars) =>
    typeof name === 'function' ? name(vars) : name;
  const verbOf = (vars: TVars) =>
    typeof verb === 'function' ? verb(vars) : verb;
  const refresh = () =>
    Promise.all(
      invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );

  return useMutation<TData, Error, TVars>({
    mutationKey,
    mutationFn: run,
    onSuccess: (data, vars) => {
      refresh().catch(() => undefined);
      onSuccess?.({ data, vars });
      if (feedback === 'none') {
        return;
      }
      const message =
        messages?.done ??
        adminActionCopy.done({
          verb: verbOf(vars),
          name: nameOf(vars),
        });
      if (undo === undefined) {
        toast.success(message, { id: message });
        return;
      }
      const itemName = nameOf(vars);
      mutationFeedback.undo({
        id: itemName.trim() === '' ? undefined : `${actionId}:${itemName}`,
        message,
        onUndo: async () => {
          try {
            await undo({ data, vars });
          } catch (error) {
            if (error instanceof Error && handleError?.(error, vars) === true) {
              mutationFeedback.markShown(error);
            }
            throw error;
          }
          await refresh();
        },
      });
    },
    onError: (error, vars) => {
      if (mutationFeedback.isQuotaExceeded(error)) {
        mutationFeedback.error({ error });
        return;
      }
      const handled = handleError?.(error, vars) === true;
      if (handled || feedback !== 'toast' || mutationFeedback.wasShown(error)) {
        mutationFeedback.markShown(error);
        return;
      }
      mutationFeedback.error({
        error,
        title:
          messages?.failed ??
          adminActionCopy.failed({
            verb: verbOf(vars),
            name: nameOf(vars),
          }),
      });
    },
  });
}

function done({ verb, name }: { verb: AdminVerb; name: string }): string {
  if (name.trim() === '') {
    return t('Changes saved');
  }
  switch (verb) {
    case 'save':
      return t('Changes saved');
    case 'create':
      return t('{name} created', { name });
    case 'update':
      return t('{name} updated', { name });
    case 'delete':
      return t('{name} deleted', { name });
    case 'remove':
      return t('{name} removed', { name });
    case 'revoke':
      return t('{name} revoked', { name });
    case 'activate':
      return t('{name} activated', { name });
    case 'deactivate':
      return t('{name} deactivated', { name });
    case 'turnOn':
      return t('{name} turned on', { name });
    case 'turnOff':
      return t('{name} turned off', { name });
    case 'reset':
      return t('{name} reset', { name });
    case 'invite':
      return t('{name} invited', { name });
    case 'connect':
      return t('{name} connected', { name });
    case 'duplicate':
      return t('{name} duplicated', { name });
    case 'sync':
      return t('{name} synced', { name });
  }
}

function failed({ verb, name }: { verb: AdminVerb; name: string }): string {
  if (name.trim() === '') {
    return t("Couldn't save changes");
  }
  switch (verb) {
    case 'save':
      return t("Couldn't save changes");
    case 'create':
      return t("Couldn't create {name}", { name });
    case 'update':
      return t("Couldn't update {name}", { name });
    case 'delete':
      return t("Couldn't delete {name}", { name });
    case 'remove':
      return t("Couldn't remove {name}", { name });
    case 'revoke':
      return t("Couldn't revoke {name}", { name });
    case 'activate':
      return t("Couldn't activate {name}", { name });
    case 'deactivate':
      return t("Couldn't deactivate {name}", { name });
    case 'turnOn':
      return t("Couldn't turn on {name}", { name });
    case 'turnOff':
      return t("Couldn't turn off {name}", { name });
    case 'reset':
      return t("Couldn't reset {name}", { name });
    case 'invite':
      return t("Couldn't invite {name}", { name });
    case 'connect':
      return t("Couldn't connect {name}", { name });
    case 'duplicate':
      return t("Couldn't duplicate {name}", { name });
    case 'sync':
      return t("Couldn't sync {name}", { name });
  }
}

function notifyDone({
  verb,
  name = '',
}: {
  verb: AdminVerb;
  name?: string;
}): void {
  const message = done({ verb, name });
  toast.success(message, { id: message });
}

function notifyStatus({ ok, message }: { ok: boolean; message: string }): void {
  if (ok) {
    toast.success(message, { id: message });
    return;
  }
  toast.error(message);
}

async function runEach<T>({
  items,
  run,
  verb,
  label,
  nameOf,
  describe,
  feedback = 'toast',
}: {
  items: T[];
  run: (item: T) => Promise<unknown>;
  verb: AdminVerb;
  label: (count: number) => string;
  nameOf?: (item: T) => string;
  describe?: (error: unknown) => string | undefined;
  feedback?: 'toast' | 'none';
}): Promise<void> {
  const results = await Promise.allSettled(items.map(run));
  const failures = results.flatMap((result) =>
    result.status === 'rejected' ? [result.reason] : [],
  );
  if (failures.length === 0) {
    return;
  }
  if (failures.length === items.length) {
    throw failures[0];
  }
  const failedOnes = items.filter(
    (_, index) => results[index].status === 'rejected',
  );
  const name =
    failedOnes.length === 1 && nameOf !== undefined
      ? nameOf(failedOnes[0])
      : label(failures.length);
  const partial = new BulkPartialFailure(failedOnes);
  if (feedback === 'none') {
    throw partial;
  }
  const reason =
    describe?.(failures[0]) ?? mutationFeedback.message(failures[0]);
  mutationFeedback.error({
    error: mutationFeedback.isQuotaExceeded(failures[0])
      ? failures[0]
      : partial,
    title: failed({ verb, name }),
    description: partialDescription({
      verb,
      done: items.length - failures.length,
      total: items.length,
      reason,
    }),
  });
  mutationFeedback.markShown(partial);
  throw partial;
}

function partialDescription({
  verb,
  done,
  total,
  reason,
}: {
  verb: AdminVerb;
  done: number;
  total: number;
  reason: string;
}): string {
  switch (verb) {
    case 'delete':
      return t('Deleted {done} of {total}. {reason}', { done, total, reason });
    case 'remove':
      return t('Removed {done} of {total}. {reason}', { done, total, reason });
    default:
      return reason;
  }
}

function isPartialFailure(error: unknown): boolean {
  return error instanceof BulkPartialFailure;
}

function failedItems<T>({ error, items }: { error: unknown; items: T[] }): T[] {
  if (!(error instanceof BulkPartialFailure)) {
    return items;
  }
  return items.filter((item) => error.failed.includes(item));
}

class BulkPartialFailure extends Error {
  constructor(readonly failed: unknown[]) {
    super('Some items failed');
  }
}

export const adminActionCopy = { done, failed };

export const adminFeedback = { done: notifyDone, status: notifyStatus };

export const adminBulk = { runEach, isPartialFailure, failedItems };

export type AdminVerb =
  | 'save'
  | 'create'
  | 'update'
  | 'delete'
  | 'remove'
  | 'revoke'
  | 'activate'
  | 'deactivate'
  | 'turnOn'
  | 'turnOff'
  | 'reset'
  | 'invite'
  | 'connect'
  | 'duplicate'
  | 'sync';

export type AdminActionConfig<TVars, TData> = {
  verb: AdminVerb | ((vars: TVars) => AdminVerb);
  name?: string | ((vars: TVars) => string);
  run: (vars: TVars) => Promise<TData>;
  invalidate?: QueryKey[];
  onSuccess?: (params: { data: TData; vars: TVars }) => void;
  undo?: (params: { data: TData; vars: TVars }) => Promise<unknown>;
  feedback?: 'toast' | 'inline' | 'none';
  handleError?: (error: Error, vars: TVars) => boolean;
  messages?: { done?: string; failed?: string };
  mutationKey?: MutationKey;
};
