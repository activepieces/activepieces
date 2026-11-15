import {
  ApErrorParams,
  ErrorCode,
  isNil,
  SeekPage,
} from '@activepieces/core-utils';
import {
  BulkActionOnRunsRequestBody,
  BulkArchiveActionOnRunsRequestBody,
  BulkCancelFlowRequestBody,
  FlowRunCountByStatus,
  FlowRunStatus,
  FlowRetryStrategy,
  FlowRun,
  FlowRunWithRetryError,
  FlowVersionState,
  isFlowRunStateTerminal,
  PopulatedFlow,
} from '@activepieces/shared';
import {
  hashKey,
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

import { getDefaultRange } from '@/components/custom/date-time-picker-range';
import { internalErrorToast } from '@/components/ui/sonner';
import { billingDialogHooks } from '@/features/billing';
import { flowsApi } from '@/features/flows/api/flows-api';
import { flowHooks } from '@/features/flows/hooks/flow-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { flowRunsApi } from '../api/flow-runs-api';
import { flowRunUtils } from '../utils/flow-run-utils';

export const flowRunKeys = {
  detail: (runId: string) => ['flow-run', runId] as const,
  batchChildren: (barrierId: string, statuses?: FlowRunStatus[]) =>
    ['batch-children', barrierId, statuses ?? null] as const,
  batchChild: (barrierId: string, dispatchIndex: number) =>
    ['batch-child', barrierId, dispatchIndex] as const,
};

const RUN_POLL_INTERVAL_MS = 7000;

const MAX_BATCH_VERSION_LOOKUPS = 10;

const STATUS_CATEGORIES = [
  {
    label: 'Succeeded',
    statuses: [FlowRunStatus.SUCCEEDED],
    color: 'var(--success-9)',
  },
  {
    label: 'Failed',
    statuses: [
      FlowRunStatus.FAILED,
      FlowRunStatus.INTERNAL_ERROR,
      FlowRunStatus.TIMEOUT,
      FlowRunStatus.MEMORY_LIMIT_EXCEEDED,
      FlowRunStatus.QUOTA_EXCEEDED,
      FlowRunStatus.LOG_SIZE_EXCEEDED,
    ],
    color: 'var(--danger-9)',
  },
  {
    label: 'Running',
    statuses: [FlowRunStatus.RUNNING],
    color: 'var(--accent-9)',
  },
  {
    label: 'Queued',
    statuses: [FlowRunStatus.QUEUED],
    color: 'var(--gray-9)',
  },
  {
    label: 'Paused',
    statuses: [FlowRunStatus.PAUSED],
    color: 'var(--warning-9)',
  },
  {
    label: 'Canceled',
    statuses: [FlowRunStatus.CANCELED],
    color: 'var(--gray-9)',
  },
] as const;

function groupByCategory(data: FlowRunCountByStatus[]) {
  const statusToCount = new Map(data.map((d) => [d.status, d.count]));
  return STATUS_CATEGORIES.map((cat) => ({
    label: cat.label,
    color: cat.color,
    count: cat.statuses.reduce(
      (sum, s) => sum + (statusToCount.get(s) ?? 0),
      0,
    ),
  })).filter((cat) => cat.count > 0);
}

function useDataUpdateCountWhen({
  condition,
  queryKey,
}: {
  condition: boolean;
  queryKey: QueryKey;
}) {
  const queryClient = useQueryClient();
  const queryHash = hashKey(queryKey);
  const countRef = useRef<number | null>(null);
  useEffect(() => {
    countRef.current = condition
      ? queryClient.getQueryCache().get(queryHash)?.state.dataUpdateCount ?? 0
      : null;
  }, [condition, queryClient, queryHash]);
  return countRef;
}

function hasFetchedSince({
  query,
  countRef,
}: {
  query: { state: { dataUpdateCount: number } };
  countRef: { current: number | null };
}): boolean {
  return (
    !isNil(countRef.current) && query.state.dataUpdateCount > countRef.current
  );
}

export const DEFAULT_DATE_PRESET = '7days' as const;

export const flowRunQueries = {
  useFlowRun: (runId: string | null) =>
    useQuery({
      queryKey: flowRunKeys.detail(runId ?? ''),
      queryFn: () => flowRunsApi.getPopulated(runId!),
      enabled: !isNil(runId),
      refetchInterval: (query) =>
        isNil(query.state.data) ||
        isFlowRunStateTerminal({
          status: query.state.data.status,
          ignoreInternalError: false,
        })
          ? false
          : RUN_POLL_INTERVAL_MS,
    }),
  useBatchChildren: ({
    barrierId,
    limit,
    statuses,
    enabled,
    allBatchesTerminal,
  }: {
    barrierId: string | null;
    limit: number;
    statuses: FlowRunStatus[] | undefined;
    enabled: boolean;
    allBatchesTerminal: boolean;
  }) => {
    const queryKey = flowRunKeys.batchChildren(barrierId ?? '', statuses);
    const countWhenAllTerminal = useDataUpdateCountWhen({
      condition: allBatchesTerminal,
      queryKey,
    });
    return useInfiniteQuery<
      SeekPage<FlowRun>,
      Error,
      InfiniteData<SeekPage<FlowRun>>,
      QueryKey,
      string | undefined
    >({
      queryKey,
      getNextPageParam: (lastPage) => lastPage.next,
      initialPageParam: undefined,
      queryFn: ({ pageParam }) =>
        flowRunsApi.list({
          projectId: authenticationSession.getProjectId()!,
          parentWaitpointId: barrierId!,
          includeArchived: true,
          limit,
          status: statuses,
          cursor: pageParam,
        }),
      enabled: enabled && !isNil(barrierId),
      refetchInterval: (query) =>
        hasFetchedSince({ query, countRef: countWhenAllTerminal })
          ? false
          : RUN_POLL_INTERVAL_MS,
    });
  },
  useBatchChildByIndex: ({
    barrierId,
    dispatchIndex,
    enabled,
    hasBatchSummary,
  }: {
    barrierId: string | null;
    dispatchIndex: number;
    enabled: boolean;
    hasBatchSummary: boolean;
  }) => {
    const queryKey = flowRunKeys.batchChild(barrierId ?? '', dispatchIndex);
    const countWhenSummaryArrived = useDataUpdateCountWhen({
      condition: hasBatchSummary,
      queryKey,
    });
    return useQuery({
      queryKey,
      queryFn: () =>
        flowRunsApi.list({
          projectId: authenticationSession.getProjectId()!,
          parentWaitpointId: barrierId!,
          dispatchIndex,
          includeArchived: true,
          limit: 1,
        }),
      enabled: enabled && !isNil(barrierId),
      refetchInterval: (query) => {
        if (!hasFetchedSince({ query, countRef: countWhenSummaryArrived })) {
          return RUN_POLL_INTERVAL_MS;
        }
        const child = query.state.data?.data[0];
        return isNil(child) ||
          isFlowRunStateTerminal({
            status: child.status,
            ignoreInternalError: false,
          })
          ? false
          : RUN_POLL_INTERVAL_MS;
      },
    });
  },
  useRunStats: () => {
    const projectId = authenticationSession.getProjectId()!;

    const { data, isLoading, dataUpdatedAt, refetch } = useQuery({
      queryKey: ['flow-run-count-by-status', projectId],
      queryFn: () => {
        const range = getDefaultRange(DEFAULT_DATE_PRESET);
        return flowRunsApi.countByStatus({
          projectId,
          createdAfter: range.from.toISOString(),
          createdBefore: range.to.toISOString(),
        });
      },
      refetchInterval: 15000,
    });

    const categories = useMemo(() => groupByCategory(data?.data ?? []), [data]);
    const total = useMemo(
      () => categories.reduce((sum, c) => sum + c.count, 0),
      [categories],
    );

    return { categories, total, isLoading, dataUpdatedAt, refetch };
  },
  useMayProcessInBatches: ({
    runs,
    includesUnlistedRuns,
    enabled,
  }: {
    runs: { flowId: string; flowVersionId: string }[];
    includesUnlistedRuns: boolean;
    enabled: boolean;
  }): boolean => {
    const oneRunPerVersion = Array.from(
      new Map(runs.map((run) => [run.flowVersionId, run])).values(),
    );
    const versionsToFetch = oneRunPerVersion.slice(
      0,
      MAX_BATCH_VERSION_LOOKUPS,
    );
    const versionQueries = useQueries({
      queries: versionsToFetch.map(({ flowId, flowVersionId }) => ({
        queryKey: flowHooks.createFlowQueryKeys({
          flowId,
          versionId: flowVersionId,
        }),
        queryFn: () => flowsApi.get(flowId, { versionId: flowVersionId }),
        staleTime: (query: { state: { data?: PopulatedFlow } }) =>
          query.state.data?.version.state === FlowVersionState.LOCKED
            ? Infinity
            : 0,
        enabled,
      })),
    });
    return flowRunUtils.mayProcessInBatches({
      versions: versionQueries.map((query) => query.data?.version),
      includesUnlistedRuns:
        includesUnlistedRuns ||
        oneRunPerVersion.length > MAX_BATCH_VERSION_LOOKUPS,
    });
  },
};

export type RunStatusCategory = ReturnType<typeof groupByCategory>[number];

export const flowRunMutations = {
  useRetryRun: ({
    onSuccess,
  }: {
    onSuccess: (result: { run: FlowRun; populatedFlow: PopulatedFlow }) => void;
  }) => {
    return useMutation<
      { run: FlowRun; populatedFlow: PopulatedFlow },
      Error,
      {
        runId: string;
        flowId: string;
        projectId: string;
        retryStrategy: FlowRetryStrategy;
      }
    >({
      mutationFn: async ({ runId, flowId, projectId, retryStrategy }) => {
        const updatedRun = await flowRunsApi.retry(runId, {
          projectId,
          strategy: retryStrategy,
        });
        const populatedFlow = await flowsApi.get(flowId, {
          versionId: updatedRun.flowVersionId,
        });
        return { run: updatedRun, populatedFlow };
      },
      onSuccess,
      onError: (error: unknown) => {
        if (api.isError(error)) {
          const apError = error.response?.data as ApErrorParams;
          if (apError.code === ErrorCode.FLOW_RUN_RETRY_OUTSIDE_RETENTION) {
            toast.error(t('Retry failed'), {
              description: t(
                'Retry is only available for {failedJobRetentionDays} after a run fails.',
                {
                  failedJobRetentionDays: apError.params.failedJobRetentionDays,
                },
              ),
              duration: 5000,
              closeButton: true,
              dismissible: true,
            });
          } else if (apError.code === ErrorCode.FLOW_RUN_NOT_RETRYABLE) {
            toast.error(t('Retry failed'), {
              description: t(
                'Only failed runs can be retried from failed step',
              ),
              duration: 5000,
              closeButton: true,
              dismissible: true,
            });
          } else if (apError.code === ErrorCode.QUOTA_EXCEEDED) {
            billingDialogHooks.useManagePlanDialogStore.getState().openDialog();
          }
          return;
        }
        internalErrorToast();
      },
    });
  },
  useBulkRetryRuns: ({
    onSuccess,
    onPartialFailure,
  }: {
    onSuccess: (runs: FlowRun[]) => void;
    onPartialFailure?: (failedRuns: Required<FlowRunWithRetryError>[]) => void;
  }) => {
    return useMutation({
      mutationFn: (request: BulkActionOnRunsRequestBody) =>
        flowRunsApi.bulkRetry(request),
      onSuccess: (runs) => {
        const succeededRuns = runs.filter((r) => !r.error) as FlowRun[];
        const failedRuns = runs.filter(
          (r) => !!r.error,
        ) as Required<FlowRunWithRetryError>[];
        onSuccess(succeededRuns);
        if (failedRuns.length > 0) {
          onPartialFailure?.(failedRuns);
        }
      },
    });
  },
  useBulkCancelRuns: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationFn: (request: BulkCancelFlowRequestBody) =>
        flowRunsApi.bulkCancel(request),
      onSuccess,
    });
  },
  useBulkArchiveRuns: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationFn: (request: BulkArchiveActionOnRunsRequestBody) =>
        flowRunsApi.bulkArchive(request),
      onSuccess,
    });
  },
};
