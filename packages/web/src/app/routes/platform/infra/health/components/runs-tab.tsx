import { PlatformMetricsReport } from '@activepieces/shared';
import { t } from 'i18next';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { listFormat } from '@/components/custom/list/list-format';
import { statDeltaUtils, StatRow } from '@/components/custom/stats';

import { InternalErrorsTable } from './internal-errors-table';
import { StatusLineChart } from './status-line-chart';

export function RunsTab({ report, isLoading, isError, onRetry }: RunsTabProps) {
  const summary = report?.summary;

  if (isError) {
    return <DataFetchErrorState entity={t('run metrics')} onRetry={onRetry} />;
  }

  return (
    <>
      <StatRow
        divided
        loading={isLoading}
        stats={[
          {
            key: 'completed',
            label: t('Jobs done'),
            hint: t('Completed jobs (success + failure) in the period'),
            value: listFormat.count(summary?.completed ?? 0),
            delta: summary
              ? statDeltaUtils.percentDelta({
                  current: summary.completed,
                  previous: summary.previousCompleted,
                })
              : undefined,
          },
          {
            key: 'success-rate',
            label: t('Success rate'),
            hint: t('Share of completed jobs that succeeded'),
            value: `${(summary?.successRate ?? 0).toFixed(1)}%`,
            delta: summary
              ? statDeltaUtils.pointDelta({
                  current: summary.successRate,
                  previous: summary.previousSuccessRate,
                })
              : undefined,
          },
        ]}
      />
      <StatusLineChart
        data={report?.statusTimeseries}
        isLoading={isLoading}
        nextRefreshAt={report?.nextRefreshAt}
      />
      <InternalErrorsTable
        internalErrors={report?.internalErrors}
        isLoading={isLoading}
      />
    </>
  );
}

type RunsTabProps = {
  report: PlatformMetricsReport | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};
