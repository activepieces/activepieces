import { PlatformMetricsReport } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { statDeltaUtils, StatRow } from '@/components/custom/stats';
import { formatUtils } from '@/lib/format-utils';

import { InternalErrorsTable } from './internal-errors-table';
import { StatusLineChart } from './status-line-chart';

type RunsTabProps = {
  report: PlatformMetricsReport | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

export function RunsTab({ report, isLoading, isError, onRetry }: RunsTabProps) {
  const summary = report?.summary;

  if (isError) {
    return (
      <DataFetchErrorState entity={t('health metrics')} onRetry={onRetry} />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {report && (
        <p className="text-sm text-gray-11">
          {t('Showing cached data · next refresh after {time}', {
            time: dayjs(report.nextRefreshAt).format('MMM D, h:mm A'),
          })}
        </p>
      )}
      <StatRow
        divided
        loading={isLoading}
        stats={[
          {
            key: 'completed',
            label: t('Jobs done'),
            hint: t('Completed jobs (success + failure) in the period'),
            value: formatUtils.formatNumber(summary?.completed ?? 0),
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

      <StatusLineChart data={report?.statusTimeseries} isLoading={isLoading} />

      <InternalErrorsTable
        internalErrors={report?.internalErrors}
        isLoading={isLoading}
      />
    </div>
  );
}
