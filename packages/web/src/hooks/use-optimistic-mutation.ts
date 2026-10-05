import {
  QueryClient,
  QueryKey,
  useMutation,
  useQueryClient,
  UseMutationOptions,
  UseMutationResult,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { mutationFeedback } from '@/lib/mutation-feedback';

export function useOptimisticMutation<TVars, TCache, TData = unknown>(
  config: OptimisticMutationConfig<TVars, TCache, TData>,
): UseMutationResult<TData, Error, TVars, OptimisticMutationContext<TCache>> {
  const queryClient = useQueryClient();
  const undoMutation = useMutation(
    buildOptions({ config, queryClient, isUndo: true }),
  );
  return useMutation(
    buildOptions({
      config,
      queryClient,
      isUndo: false,
      runUndo: (vars) => undoMutation.mutateAsync(vars),
    }),
  );
}

function buildOptions<TVars, TCache, TData>({
  config,
  queryClient,
  isUndo,
  runUndo,
}: {
  config: OptimisticMutationConfig<TVars, TCache, TData>;
  queryClient: QueryClient;
  isUndo: boolean;
  runUndo?: (vars: TVars) => Promise<TData>;
}): UseMutationOptions<TData, Error, TVars, OptimisticMutationContext<TCache>> {
  const {
    mutationFn,
    queryKey,
    apply,
    invalidate = [],
    scope,
    success,
    undo,
    errorTitle,
  } = config;
  return {
    mutationFn,
    scope: scope === undefined ? undefined : { id: scope },
    meta: { undo: isUndo },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey });
      const snapshot = queryClient.getQueriesData<TCache>({ queryKey });
      const previous = queryClient.getQueryData<TCache>(queryKey);
      queryClient.setQueriesData<TCache>({ queryKey }, (current) =>
        current === undefined ? current : apply({ current, vars }),
      );
      return { snapshot, previous };
    },
    onError: (error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      mutationFeedback.error({
        error,
        title: isUndo ? t("Couldn't undo") : errorTitle,
      });
    },
    onSuccess: (data, vars, context) => {
      if (isUndo) {
        return;
      }
      const message = success?.({ vars, data });
      if (undo !== undefined && runUndo !== undefined) {
        mutationFeedback.undo({
          message: message ?? t('Changes saved'),
          onUndo: () => runUndo(undo({ vars, previous: context?.previous })),
        });
        return;
      }
      if (message !== undefined) {
        toast.success(message);
      }
    },
    onSettled: () =>
      Promise.all(
        [queryKey, ...invalidate].map((key) =>
          queryClient.invalidateQueries({ queryKey: key }),
        ),
      ),
  };
}

export type OptimisticMutationConfig<TVars, TCache, TData = unknown> = {
  mutationFn: (vars: TVars) => Promise<TData>;
  queryKey: QueryKey;
  apply: (params: { current: TCache; vars: TVars }) => TCache;
  invalidate?: QueryKey[];
  scope?: string;
  success?: (params: { vars: TVars; data: TData }) => string;
  undo?: (params: { vars: TVars; previous: TCache | undefined }) => TVars;
  errorTitle?: string;
};

export type OptimisticMutationContext<TCache> = {
  snapshot: [QueryKey, TCache | undefined][];
  previous: TCache | undefined;
};
