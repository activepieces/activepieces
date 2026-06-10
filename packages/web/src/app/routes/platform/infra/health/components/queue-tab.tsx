import { PlatformMetricsLive } from '@activepieces/shared';
import { t } from 'i18next';
import { Activity, Loader2 } from 'lucide-react';

import { formatUtils } from '@/lib/format-utils';

import { MetricCard } from '../../../../impact/summary/metric-card';

import { StuckJobsTable } from './stuck-jobs-table';

type QueueTabProps = {
  live: PlatformMetricsLive | undefined;
  isLoading: boolean;
};

export function QueueTab({ live, isLoading }: QueueTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          icon={Activity}
          title={t('Running')}
          value={isLoading ? '—' : formatUtils.formatNumber(live?.running ?? 0)}
          description={t('Jobs currently executing on workers')}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
        />
        <MetricCard
          icon={Loader2}
          title={t('Queued')}
          value={isLoading ? '—' : formatUtils.formatNumber(live?.queued ?? 0)}
          description={t('Jobs waiting in the queue')}
          iconColor="text-amber-500"
          iconBgColor="bg-amber-500/10"
        />
      </div>

      <StuckJobsTable stuckJobs={live?.stuckJobs} isLoading={isLoading} />
    </div>
  );
}
