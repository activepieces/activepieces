import {
  ApErrorParams,
  BulkActionOnRunsRequestBody,
  BulkArchiveActionOnRunsRequestBody,
  BulkCancelFlowRequestBody,
  ErrorCode,
  FlowRunCountByStatus,
  FlowRunStatus,
  FlowRetryStrategy,
  FlowRun,
  FlowRunWithRetryError,
  PopulatedFlow,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { getDefaultRange } from '@/components/custom/date-time-picker-range';
import { internalErrorToast } from '@/components/ui/sonner';
import { flowsApi } from '@/features/flows/api/flows-api';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { flowRunsApi } from '../api/flow-runs-api';

export const flowRunKeys = {
  detail: (runId: string) => ['flow-run', runId] as const,
};

const STATUS_CATEGORIES = [
  {
    label: 'Succeeded',
    statuses: [FlowRunStatus.SUCCEEDED],
    color: 'var(--success)',
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
    color: 'var(--destructive)',
  },
  {
    label: 'Running',
    statuses: [FlowRunStatus.RUNNING],
    color: 'var(--primary)',
  },
  {
    label: 'Queued',
    statuses: [FlowRunStatus.QUEUED],
    color: 'var(--muted-foreground)',
  },
  {
    label: 'Paused',
    statuses: [FlowRunStatus.PAUSED],
    color: 'var(--warning)',
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
      refetchInterval: 15000,
    }),
  useRunStats: () => {
    const projectId = authenticationSession.getProjectId()!;

    const { data, isLoading } = useQuery({
      queryKey: ['flow-run-count-by-status', projectId],
      queryFn: () => {
        const range = getDefaultRange(DEFAULT_DATE_PRESET);
        return flowRunsApi.countByStatus({
          projectId,
          createdAfter: range.from.toISOString(),
          createdBefore: range.to.toISOString(),
        });
      },
      refetchInterval: 5000,
    });

    const categories = useMemo(() => groupByCategory(data?.data ?? []), [data]);
    const total = useMemo(
      () => categories.reduce((sum, c) => sum + c.count, 0),
      [categories],
    );

    return { categories, total, isLoading };
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
