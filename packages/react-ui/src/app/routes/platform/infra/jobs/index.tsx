import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Activity } from 'lucide-react';

import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { Separator } from '@/components/ui/separator';
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
    case WorkerJobType.DELAYED_FLOW:
      return t(
        'Runs flows that were scheduled for later, like paused flows or delayed executions.',
      );
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
  const { data: workerJobsStats, isLoading } = useQuery<QueueMetricsResponse>({
    queryKey: ['worker-job-stats'],
    queryFn: async () => queueMetricsApi.getMetrics(),
    staleTime: 5000,
    refetchInterval: 5000,
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
      )}
      <Separator className="my-4" />
    </div>
  );
}
