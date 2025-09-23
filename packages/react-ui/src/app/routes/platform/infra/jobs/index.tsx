import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Activity } from 'lucide-react';

import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { Separator } from '@/components/ui/separator';
import {
  apId,
  WorkerJobType,
  WorkerJobStatItem,
  WorkerJobLog,
} from '@activepieces/shared';

import { LogsDataTable } from './logs-data-table';
import { StatusLegend } from './status-legend';
import { WorkerJobCard } from './worker-job-card';

export const mockJobStats: WorkerJobStatItem[] = [
  {
    jobType: WorkerJobType.RENEW_WEBHOOK,
    stats: { active: 5, failed: 2, retried: 3, delayed: 10, throttled: 0 },
  },
  {
    jobType: WorkerJobType.EXECUTE_POLLING,
    stats: { active: 12, failed: 0, retried: 1, delayed: 25, throttled: 2 },
  },
  {
    jobType: WorkerJobType.DELAYED_FLOW,
    stats: { active: 0, failed: 5, retried: 8, delayed: 45, throttled: 0 },
  },
  {
    jobType: WorkerJobType.EXECUTE_WEBHOOK,
    stats: { active: 8, failed: 3, retried: 4, delayed: 0, throttled: 0 },
  },
  {
    jobType: WorkerJobType.EXECUTE_FLOW,
    stats: { active: 15, failed: 12, retried: 18, delayed: 5, throttled: 4 },
  },
  {
    jobType: WorkerJobType.EXECUTE_AGENT,
    stats: { active: 3, failed: 1, retried: 2, delayed: 0, throttled: 0 },
  },
  {
    jobType: WorkerJobType.EXECUTE_VALIDATION,
    stats: { active: 0, failed: 0, retried: 0, delayed: 2, throttled: 0 },
  },
  {
    jobType: WorkerJobType.EXECUTE_TRIGGER_HOOK,
    stats: { active: 6, failed: 4, retried: 7, delayed: 8, throttled: 1 },
  },
  {
    jobType: WorkerJobType.EXECUTE_PROPERTY,
    stats: { active: 1, failed: 0, retried: 0, delayed: 0, throttled: 0 },
  },
  {
    jobType: WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION,
    stats: { active: 2, failed: 8, retried: 12, delayed: 3, throttled: 0 },
  },
  {
    jobType: WorkerJobType.EXECUTE_TOOL,
    stats: { active: 4, failed: 2, retried: 3, delayed: 1, throttled: 0 },
  },
];

const generateMockLogs = (
  jobType: WorkerJobType,
  count: number,
  status: string,
): WorkerJobLog[] =>
  Array.from({ length: count }, (_, i) => {
    const now = new Date();
    const created = new Date(now.getTime() - Math.random() * 10000000);
    return {
      id: apId(),
      created: created.toISOString(),
      updated: now.toISOString(),
      jobType,
      status,
      data: {
        message: `Log for ${jobType} job #${i} with status ${status}.`,
        details: `This is mock data for a ${status.toLowerCase()} job.`,
        flowId: `flow_${Math.random().toString(36).substring(7)}`,
        runId: `run_${Math.random().toString(36).substring(7)}`,
        error: status === 'failed' ? t('errorMessage') : null,
      },
    };
  });

export const allMockLogs: WorkerJobLog[] = Array.from({ length: 5 }, () =>
  mockJobStats.flatMap(({ jobType, stats }: WorkerJobStatItem) => [
    ...generateMockLogs(jobType, stats.active, 'active'),
    ...generateMockLogs(jobType, stats.failed, 'failed'),
    ...generateMockLogs(jobType, stats.retried, 'retrying'),
    ...generateMockLogs(jobType, stats.delayed, 'delayed'),
    ...generateMockLogs(jobType, stats.throttled, 'throttled'),
  ]),
).flat();

export const getJobTypeDescription = (jobType: WorkerJobType): string => {
  switch (jobType) {
    case WorkerJobType.RENEW_WEBHOOK:
      return t('renewWebhookDescription');
    case WorkerJobType.EXECUTE_POLLING:
      return t('executePollingDescription');
    case WorkerJobType.DELAYED_FLOW:
      return t('delayedFlowDescription');
    case WorkerJobType.EXECUTE_WEBHOOK:
      return t('executeWebhookDescription');
    case WorkerJobType.EXECUTE_FLOW:
      return t('executeFlowDescription');
    case WorkerJobType.EXECUTE_AGENT:
      return t('executeAgentDescription');
    case WorkerJobType.EXECUTE_VALIDATION:
      return t('executeValidationDescription');
    case WorkerJobType.EXECUTE_TRIGGER_HOOK:
      return t('executeTriggerHookDescription');
    case WorkerJobType.EXECUTE_PROPERTY:
      return t('executePropertyDescription');
    case WorkerJobType.EXECUTE_EXTRACT_PIECE_INFORMATION:
      return t('executeExtractPieceInformationDescription');
    case WorkerJobType.EXECUTE_TOOL:
      return t('executeToolDescription');
    default:
      return t('noDescription');
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active':
      return t('statusActive');
    case 'retrying':
      return t('statusRetrying');
    case 'delayed':
      return t('statusDelayed');
    case 'throttled':
      return t('statusThrottled');
    case 'failed':
      return t('statusFailed');
    default:
      return t(status.toUpperCase());
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-blue-500';
    case 'retrying':
      return 'bg-yellow-500';
    case 'delayed':
      return 'bg-purple-500';
    case 'throttled':
      return 'bg-gray-500';
    case 'failed':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export const STATUS_TYPES = [
  'active',
  'retrying',
  'delayed',
  'throttled',
  'failed',
];

export default function SettingsJobsPage() {
  const { data: workerJobsStats, isLoading } = useQuery<WorkerJobStatItem[]>({
    queryKey: ['worker-job-stats'],
    queryFn: async () => mockJobStats,
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
      <DashboardPageHeader
        title={t('jobLogsTitle')}
        description={t('jobLogsDescription')}
      />
      <LogsDataTable />
    </div>
  );
}
