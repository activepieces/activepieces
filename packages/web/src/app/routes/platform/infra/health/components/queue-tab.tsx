import { PlatformMetricsLive } from '@activepieces/shared';
import { Loading02Icon, Pulse01Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

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
          icon={Pulse01Icon}
          title={t('Running')}
          value={isLoading ? '—' : formatUtils.formatNumber(live?.running ?? 0)}
          description={t('Jobs currently executing on workers')}
          iconColor="text-swatch-11-mark"
          iconBgColor="bg-swatch-11-surface"
        />
        <MetricCard
          icon={Loading02Icon}
          title={t('Queued')}
          value={isLoading ? '—' : formatUtils.formatNumber(live?.queued ?? 0)}
          description={t('Jobs waiting in the queue')}
          iconColor="text-swatch-6-mark"
          iconBgColor="bg-swatch-6-surface"
        />
      </div>

      <StuckJobsTable stuckJobs={live?.stuckJobs} isLoading={isLoading} />
    </div>
  );
}
