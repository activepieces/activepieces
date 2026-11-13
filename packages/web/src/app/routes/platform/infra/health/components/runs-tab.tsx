import { PlatformMetricsReport } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { CheckCircle2, ListChecks } from 'lucide-react';
import { ReactNode } from 'react';

import { StatCard, StatGrid } from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { InternalErrorsTable } from './internal-errors-table';
import { StatusLineChart } from './status-line-chart';

function renderDelta(current: number, previous: number): ReactNode {
  if (previous === 0) {
    return undefined;
  }
  const change = ((current - previous) / previous) * 100;
  const isUp = change >= 0;
  return (
    <span>
      <span className={cn(isUp ? 'text-success-11' : 'text-danger-11')}>
        {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
      </span>{' '}
      {t('vs last period')}
    </span>
  );
}

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
    <>
      <div className="flex flex-col gap-2">
        {report && (
          <p className="text-xs text-gray-11">
            {t('Showing cached data · next refresh after {time}', {
              time: dayjs(report.nextRefreshAt).format('MMM D, h:mm A'),
            })}
          </p>
        )}
        <StatGrid columns={2}>
          <StatCard
            icon={<ListChecks />}
            label={t('Jobs done')}
            info={t('Completed jobs (success + failure) in the period')}
            value={
              isLoading
                ? '—'
                : formatUtils.formatNumber(summary?.completed ?? 0)
            }
            hint={
              summary
                ? renderDelta(summary.completed, summary.previousCompleted)
                : undefined
            }
          />
          <StatCard
            icon={<CheckCircle2 />}
            label={t('Success rate')}
            info={t('Share of completed jobs that succeeded')}
            value={
              isLoading ? '—' : `${(summary?.successRate ?? 0).toFixed(1)}%`
            }
            hint={
              summary
                ? renderDelta(summary.successRate, summary.previousSuccessRate)
                : undefined
            }
          />
        </StatGrid>
      </div>

      <StatusLineChart data={report?.statusTimeseries} isLoading={isLoading} />

      <InternalErrorsTable
        internalErrors={report?.internalErrors}
        isLoading={isLoading}
      />
    </>
  );
}
