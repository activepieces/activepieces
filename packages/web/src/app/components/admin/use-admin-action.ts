import {
  QueryKey,
  useMutation,
  useQueryClient,
  UseMutationResult,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { mutationFeedback } from '@/lib/mutation-feedback';

export function useAdminAction<TVars = void, TData = unknown>({
  verb,
  name,
  run,
  invalidate = [],
  onSuccess,
  undo,
  feedback = 'toast',
}: AdminActionConfig<TVars, TData>): UseMutationResult<TData, Error, TVars> {
  const queryClient = useQueryClient();
  const nameOf = (vars: TVars) =>
    typeof name === 'function' ? name(vars) : name;
  const refresh = () =>
    Promise.all(
      invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );

  return useMutation<TData, Error, TVars>({
    mutationFn: run,
    onSuccess: async (data, vars) => {
      await refresh();
      onSuccess?.({ data, vars });
      if (feedback === 'none') {
        return;
      }
      const message = adminActionCopy.done({ verb, name: nameOf(vars) });
      if (undo === undefined) {
        toast.success(message);
        return;
      }
      mutationFeedback.undo({
        message,
        onUndo: async () => {
          await undo({ data, vars });
          await refresh();
        },
      });
    },
    onError: (error, vars) => {
      if (feedback !== 'toast' || mutationFeedback.wasShown(error)) {
        mutationFeedback.markShown(error);
        return;
      }
      mutationFeedback.error({
        error,
        title: adminActionCopy.failed({ verb, name: nameOf(vars) }),
      });
    },
  });
}

function done({ verb, name }: { verb: AdminVerb; name: string }): string {
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

export const adminActionCopy = { done, failed };

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
  verb: AdminVerb;
  name: string | ((vars: TVars) => string);
  run: (vars: TVars) => Promise<TData>;
  invalidate?: QueryKey[];
  onSuccess?: (params: { data: TData; vars: TVars }) => void;
  undo?: (params: { data: TData; vars: TVars }) => Promise<unknown>;
  feedback?: 'toast' | 'inline' | 'none';
};
