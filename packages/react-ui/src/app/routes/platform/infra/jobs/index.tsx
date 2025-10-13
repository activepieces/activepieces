import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Activity, RotateCcw } from 'lucide-react';

import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { queueMetricsApi } from '@/features/platform-admin/lib/queue-metrics-api';
import {
  WorkerJobType,
  WorkerJobStatus,
  QueueMetricsResponse,
} from '@activepieces/shared';

import { StatusLegend } from './status-legend';
import { WorkerJobCard } from './worker-job-card';

export const getJobTypeDescription = (
  jobType: WorkerJobType,
): string | undefined => {
  switch (jobType) {
    case WorkerJobType.RENEW_WEBHOOK:
      return t(
        'Renews webhooks for pieces that need to stay connected to external services like Google Sheets.',
      );
    case WorkerJobType.EXECUTE_POLLING:
      return t('Checks external services for new data at regular intervals.');
    case WorkerJobType.EXECUTE_WEBHOOK:
      return t('Processes incoming webhook requests that start flow runs.');
    case WorkerJobType.EXECUTE_FLOW:
      return t('Runs flows when they’re triggered.');
    case WorkerJobType.EXECUTE_AGENT:
      return t('Runs AI agent tasks within flows.');
    case WorkerJobType.EXECUTE_TOOL:
      return t(
        'Runs tool operations in flows, usually for AI-powered features.',
      );
    default:
      return;
  }
};

export const getStatusLabel = (status: WorkerJobStatus): string => {
  switch (status) {
    case WorkerJobStatus.ACTIVE:
      return t('Active');
    case WorkerJobStatus.RETRYING:
      return t('Retrying');
    case WorkerJobStatus.DELAYED:
      return t('Delayed');
    case WorkerJobStatus.FAILED:
      return t('Failed');
    case WorkerJobStatus.QUEUED:
      return t('Queued');
  }
};

export const getStatusColor = (status: WorkerJobStatus) => {
  switch (status) {
    case WorkerJobStatus.QUEUED:
      return 'bg-yellow-500';
    case WorkerJobStatus.ACTIVE:
      return 'bg-blue-500';
    case WorkerJobStatus.RETRYING:
      return 'bg-orange-500';
    case WorkerJobStatus.DELAYED:
      return 'bg-purple-500';
    case WorkerJobStatus.FAILED:
      return 'bg-red-500';
  }
};

export default function SettingsJobsPage() {
  const queryClient = useQueryClient();
  const { data: workerJobsStats, isLoading } = useQuery<QueueMetricsResponse>({
    queryKey: ['worker-job-stats'],
    queryFn: async () => queueMetricsApi.getMetrics(),
    staleTime: 5000,
    refetchInterval: 5000,
  });

  const { mutate: resetMetrics, isPending: isResetting } = useMutation({
    mutationFn: async () => queueMetricsApi.resetMetrics(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-job-stats'] });
    },
    onError: () => {
      toast({
        title: t('Error'),
        description: t('Failed to reset metrics'),
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="flex w-full flex-col gap-4">
      <DashboardPageHeader
        title={t('System jobs overview')}
        description={t('System Jobs Queue Metrics')}
      />
      <StatusLegend />
      {isLoading ? (
        <div className="flex items-center justify-center p-10">
          <Activity className="size-8 animate-spin text-slate-500" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Button
            className="self-end w-fit"
            variant="outline"
            onClick={() => resetMetrics()}
            loading={isResetting}
          >
            <RotateCcw className="size-4" />
            Reset Metrics
          </Button>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(workerJobsStats?.statsPerJobType ?? {}).map(
              ([jobType, stats]) => (
                <WorkerJobCard
                  key={jobType}
                  jobType={jobType as WorkerJobType}
                  stats={stats}
                  description={getJobTypeDescription(jobType as WorkerJobType)}
                />
              ),
            )}
          </div>
        </div>
      )}
      <Separator className="my-4" />
    </div>
  );
}
