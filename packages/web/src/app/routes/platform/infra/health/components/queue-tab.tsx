import { PlatformMetricsLive } from '@activepieces/shared';
import { t } from 'i18next';
import { Activity, Hourglass } from 'lucide-react';

import { AdminQueryState, StatCard, StatGrid } from '@/app/components/admin';
import { formatUtils } from '@/lib/format-utils';

import { StuckJobsTable } from './stuck-jobs-table';

type QueueTabProps = {
  live: PlatformMetricsLive | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => unknown;
};

export function QueueTab({ live, isLoading, isError, onRetry }: QueueTabProps) {
  return (
    <AdminQueryState
      isLoading={false}
      isError={isError}
      onRetry={onRetry}
      entity={t('queue metrics')}
    >
      <StatGrid columns={2}>
        <StatCard
          icon={<Activity />}
          label={t('Running')}
          info={t('Jobs currently executing on workers')}
          value={isLoading ? '—' : formatUtils.formatNumber(live?.running ?? 0)}
        />
        <StatCard
          icon={<Hourglass />}
          label={t('Queued')}
          info={t('Jobs waiting in the queue')}
          value={isLoading ? '—' : formatUtils.formatNumber(live?.queued ?? 0)}
        />
      </StatGrid>

      <StuckJobsTable stuckJobs={live?.stuckJobs} isLoading={isLoading} />
    </AdminQueryState>
  );
}
