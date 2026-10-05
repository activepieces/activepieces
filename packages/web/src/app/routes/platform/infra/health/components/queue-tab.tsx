import { PlatformMetricsLive } from '@activepieces/shared';
import { t } from 'i18next';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { listFormat } from '@/components/custom/list/list-format';
import { StatRow } from '@/components/custom/stats';

import { StuckJobsTable } from './stuck-jobs-table';

export function QueueTab({ live, isLoading, isError, onRetry }: QueueTabProps) {
  if (isError) {
    return (
      <DataFetchErrorState entity={t('queue metrics')} onRetry={onRetry} />
    );
  }
  return (
    <>
      <StatRow
        divided
        loading={isLoading}
        stats={[
          {
            key: 'running',
            label: t('Running'),
            hint: t('Jobs currently executing on workers'),
            value: listFormat.count(live?.running ?? 0),
          },
          {
            key: 'queued',
            label: t('Queued'),
            hint: t('Jobs waiting in the queue'),
            value: listFormat.count(live?.queued ?? 0),
          },
        ]}
      />
      <StuckJobsTable stuckJobs={live?.stuckJobs} isLoading={isLoading} />
    </>
  );
}

type QueueTabProps = {
  live: PlatformMetricsLive | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};
