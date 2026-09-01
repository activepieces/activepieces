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
  isFlowRunStateTerminal,
  PopulatedFlow,
} from '@activepieces/shared';
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { getDefaultRange } from '@/components/custom/date-time-picker-range';
import { internalErrorToast } from '@/components/ui/sonner';
import { useManagePlanDialogStore } from '@/features/billing';
import { flowsApi } from '@/features/flows/api/flows-api';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { flowRunsApi } from '../api/flow-runs-api';
import {
  flowRunUtils,
  MAX_BATCH_VERSION_LOOKUPS,
} from '../utils/flow-run-utils';

export const flowRunKeys = {
  detail: (runId: string) => ['flow-run', runId] as const,
  batchChildren: (barrierId: string, statuses?: FlowRunStatus[]) =>
    ['batch-children', barrierId, statuses ?? null] as const,
  batchChild: (barrierId: string, dispatchIndex: number) =>
    ['batch-child', barrierId, dispatchIndex] as const,
  flowVersionBatch: (flowVersionId: string) =>
    ['flow-version-batch', flowVersionId] as const,
};

const STATUS_CATEGORIES = [
  {
    label: 'Succeeded',
    statuses: [FlowRunStatus.SUCCEEDED],
    color: 'hsl(var(--success))',
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
    color: 'hsl(var(--destructive))',
  },
  {
    label: 'Running',
    statuses: [FlowRunStatus.RUNNING],
    color: 'hsl(var(--primary))',
  },
  {
    label: 'Queued',
    statuses: [FlowRunStatus.QUEUED],
    color: 'var(--muted-foreground)',
  },
  {
    label: 'Paused',
    statuses: [FlowRunStatus.PAUSED],
    color: 'hsl(var(--warning))',
  },
  {
    label: 'Canceled',
    statuses: [FlowRunStatus.CANCELED],
    color: 'var(--muted-foreground)',
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

export const DEFAULT_DATE_PRESET = '7days' as const;

export const flowRunQueries = {
  useFlowRun: (runId: string) =>
    useQuery({
      queryKey: flowRunKeys.detail(runId),
      queryFn: () => flowRunsApi.getPopulated(runId),
      refetchInterval: 7000,
    }),
  useBatchChildrenPage: ({
    barrierId,
    limit,
    statuses,
    enabled,
    isDispatchComplete,
  }: {
    barrierId: string | null;
    limit: number;
    statuses: FlowRunStatus[] | undefined;
    enabled: boolean;
    isDispatchComplete: boolean;
  }) =>
    useInfiniteQuery<SeekPage<FlowRun>, Error, InfiniteData<SeekPage<FlowRun>>>(
      {
        queryKey: flowRunKeys.batchChildren(barrierId ?? '', statuses),
        getNextPageParam: (lastPage) => lastPage.next,
        initialPageParam: undefined,
        queryFn: ({ pageParam }) =>
          flowRunsApi.list({
            projectId: authenticationSession.getProjectId()!,
            parentWaitpointId: barrierId!,
            includeArchived: true,
            limit,
            status: statuses,
            cursor: pageParam as string | undefined,
          }),
        enabled: enabled && !isNil(barrierId),
        refetchInterval: (query) =>
          isDispatchComplete && !hasPendingChild(query.state.data)
            ? false
            : 7000,
      },
    ),
  useBatchChild: ({
    barrierId,
    dispatchIndex,
    enabled,
    isDispatchComplete,
  }: {
    barrierId: string | null;
    dispatchIndex: number;
    enabled: boolean;
    isDispatchComplete: boolean;
  }) =>
    useQuery({
      queryKey: flowRunKeys.batchChild(barrierId ?? '', dispatchIndex),
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
        if (!isDispatchComplete) {
          return 7000;
        }
        const child = query.state.data?.data[0];
        return isNil(child) || isRunSettled(child.status) ? false : 7000;
      },
    }),
  useBatchChildRun: ({ childRunId }: { childRunId: string | null }) =>
    useQuery({
      queryKey: flowRunKeys.detail(childRunId ?? ''),
      queryFn: () => flowRunsApi.getPopulated(childRunId!),
      enabled: !isNil(childRunId),
      refetchInterval: (query) =>
        isNil(query.state.data) ||
        isFlowRunStateTerminal({
          status: query.state.data.status,
          ignoreInternalError: false,
        })
          ? false
          : 7000,
    }),
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
    hasUnknownRuns,
    enabled,
  }: {
    runs: { flowId: string; flowVersionId: string }[];
    hasUnknownRuns: boolean;
    enabled: boolean;
  }): boolean => {
    const distinctVersions = Array.from(
      new Map(runs.map((run) => [run.flowVersionId, run])).values(),
    );
    const lookedUpVersions = distinctVersions.slice(
      0,
      MAX_BATCH_VERSION_LOOKUPS,
    );
    const versionQueries = useQueries({
      queries: lookedUpVersions.map(({ flowId, flowVersionId }) => ({
        queryKey: flowRunKeys.flowVersionBatch(flowVersionId),
        queryFn: () => flowsApi.get(flowId, { versionId: flowVersionId }),
        staleTime: Infinity,
        enabled,
      })),
    });
    return flowRunUtils.mayProcessInBatches({
      versions: versionQueries.map((query) => query.data?.version),
      hasUnknownRuns:
        hasUnknownRuns || distinctVersions.length > MAX_BATCH_VERSION_LOOKUPS,
    });
  },
};

export type RunStatusCategory = ReturnType<typeof groupByCategory>[number];

function isRunSettled(status: FlowRunStatus): boolean {
  return isFlowRunStateTerminal({ status, ignoreInternalError: false });
}

function hasPendingChild(
  data: InfiniteData<SeekPage<FlowRun>> | undefined,
): boolean {
  return (data?.pages ?? []).some((page) =>
    page.data.some((child) => !isRunSettled(child.status)),
  );
}

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
          } else if (apError.code === ErrorCode.QUOTA_EXCEEDED) {
            useManagePlanDialogStore.getState().openDialog();
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
