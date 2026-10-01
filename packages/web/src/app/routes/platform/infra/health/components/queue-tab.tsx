import { PlatformMetricsLive } from '@activepieces/shared';
import { t } from 'i18next';

import { StatRow } from '@/components/custom/stats';
import { formatUtils } from '@/lib/format-utils';

import { StuckJobsTable } from './stuck-jobs-table';

type QueueTabProps = {
  live: PlatformMetricsLive | undefined;
  isLoading: boolean;
};

export function QueueTab({ live, isLoading }: QueueTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <StatRow
        divided
        loading={isLoading}
        stats={[
          {
            key: 'running',
            label: t('Running'),
            hint: t('Jobs currently executing on workers'),
            value: formatUtils.formatNumber(live?.running ?? 0),
          },
          {
            key: 'queued',
            label: t('Queued'),
            hint: t('Jobs waiting in the queue'),
            value: formatUtils.formatNumber(live?.queued ?? 0),
          },
        ]}
      />

      <StuckJobsTable stuckJobs={live?.stuckJobs} isLoading={isLoading} />
    </div>
  );
}
