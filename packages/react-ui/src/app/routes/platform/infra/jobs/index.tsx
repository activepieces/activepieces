import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Activity } from 'lucide-react';
import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { Separator } from '@/components/ui/separator';
import {
  WorkerJobType,
  WorkerJobStatus,
  QueueMetricsResponse,
} from '@activepieces/shared';
import { StatusLegend } from './status-legend';
import { WorkerJobCard } from './worker-job-card';
import { queueMetricsApi } from '@/features/platform-admin/lib/queue-metrics-api';

export const getJobTypeDescription = (jobType: WorkerJobType): string => {
  switch (jobType) {
    case WorkerJobType.RENEW_WEBHOOK:
      return t('Renew Webhook');
    case WorkerJobType.EXECUTE_POLLING:
      return t('Execute Polling');
    case WorkerJobType.DELAYED_FLOW:
      return t('Delayed Flow');
    case WorkerJobType.EXECUTE_WEBHOOK:
      return t('Execute Webhook');
    case WorkerJobType.EXECUTE_FLOW:
      return t('Execute Flow');
    case WorkerJobType.EXECUTE_AGENT:
      return t('Execute Agent');
    case WorkerJobType.EXECUTE_VALIDATION:
      return t('Execute Validation');
    case WorkerJobType.EXECUTE_TRIGGER_HOOK:
      return t('Execute Trigger Hook');
    case WorkerJobType.EXECUTE_PROPERTY:
      return t('Execute Property');
    case WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
      return t('Extract Piece Information');
    case WorkerJobType.EXECUTE_TOOL:
      return t('Execute Tool');
    default:
      return t('No description');
  }
};

export const getStatusLabel = (status: WorkerJobStatus): string => {
  switch (status) {
    case WorkerJobStatus.ACTIVE:
      return t('statusActive');
    case WorkerJobStatus.RETRYING:
      return t('statusRetrying');
    case WorkerJobStatus.DELAYED:
      return t('statusDelayed');
    case WorkerJobStatus.FAILED:
      return t('statusFailed');
    case WorkerJobStatus.QUEUED:
      return t('statusQueued');
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
        title={t('systemJobsOverviewTitle')}
        description={t('systemJobsOverviewDescription')}
      />
      <StatusLegend />
      {isLoading ? (
        <div className="flex items-center justify-center p-10">
          <Activity className="size-8 animate-spin text-slate-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workerJobsStats?.map(({ jobType, stats }) => (
            <WorkerJobCard
              key={jobType}
              jobType={jobType}
              stats={stats}
              description={getJobTypeDescription(jobType)}
            />
          ))}
        </div>
      )}
      <Separator className="my-4" />
    </div>
  );
}
