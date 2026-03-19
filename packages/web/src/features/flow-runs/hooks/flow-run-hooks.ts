import {
  ApErrorParams,
  BulkActionOnRunsRequestBody,
  BulkArchiveActionOnRunsRequestBody,
  BulkCancelFlowRequestBody,
  ErrorCode,
  FlowRetryStrategy,
  FlowRun,
  FlowRunWithRetryError,
  PopulatedFlow,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { internalErrorToast } from '@/components/ui/sonner';
import { flowsApi } from '@/features/flows/api/flows-api';
import { api } from '@/lib/api';

import { flowRunsApi } from '../api/flow-runs-api';

export const flowRunKeys = {
  detail: (runId: string) => ['flow-run', runId] as const,
};

export const flowRunQueries = {
  useFlowRun: (runId: string) =>
    useQuery({
      queryKey: flowRunKeys.detail(runId),
      queryFn: () => flowRunsApi.getPopulated(runId),
      refetchInterval: 15000,
    }),
};

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
