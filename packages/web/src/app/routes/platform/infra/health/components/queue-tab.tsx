import { PlatformMetricsLive } from '@activepieces/shared';
import { t } from 'i18next';
import { Activity, Loader2 } from 'lucide-react';

import { StatCard, StatGrid } from '@/app/components/admin';
import { formatUtils } from '@/lib/format-utils';

import { StuckJobsTable } from './stuck-jobs-table';

type QueueTabProps = {
  live: PlatformMetricsLive | undefined;
  isLoading: boolean;
};

export function QueueTab({ live, isLoading }: QueueTabProps) {
  return (
    <>
      <StatGrid columns={2}>
        <StatCard
          icon={<Activity />}
          label={t('Running')}
          info={t('Jobs currently executing on workers')}
          value={isLoading ? '—' : formatUtils.formatNumber(live?.running ?? 0)}
        />
        <StatCard
          icon={<Loader2 />}
          label={t('Queued')}
          info={t('Jobs waiting in the queue')}
          value={isLoading ? '—' : formatUtils.formatNumber(live?.queued ?? 0)}
        />
      </StatGrid>

      <StuckJobsTable stuckJobs={live?.stuckJobs} isLoading={isLoading} />
    </>
  );
}
