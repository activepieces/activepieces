import { PlatformMetricsReport } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { CheckCircle2, ListChecks } from 'lucide-react';
import { ReactNode } from 'react';

import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { MetricCard } from '../../../../impact/summary/metric-card';

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
      <span className={cn(isUp ? 'text-emerald-600' : 'text-destructive')}>
        {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
      </span>{' '}
      {t('vs last period')}
    </span>
  );
}

type RunsTabProps = {
  report: PlatformMetricsReport | undefined;
  isLoading: boolean;
};

export function RunsTab({ report, isLoading }: RunsTabProps) {
  const summary = report?.summary;

  return (
    <div className="flex flex-col gap-4">
      {report && (
        <p className="px-5 text-xs text-muted-foreground">
          {t('Showing cached data · next refresh after {time}', {
            time: dayjs(report.nextRefreshAt).format('MMM D, h:mm A'),
          })}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          icon={ListChecks}
          title={t('Jobs done')}
          value={
            isLoading ? '—' : formatUtils.formatNumber(summary?.completed ?? 0)
          }
          description={t('Completed jobs (success + failure) in the period')}
          subtitle={
            summary
              ? renderDelta(summary.completed, summary.previousCompleted)
              : undefined
          }
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
        />
        <MetricCard
          icon={CheckCircle2}
          title={t('Success rate')}
          value={isLoading ? '—' : `${(summary?.successRate ?? 0).toFixed(1)}%`}
          description={t('Share of completed jobs that succeeded')}
          subtitle={
            summary
              ? renderDelta(summary.successRate, summary.previousSuccessRate)
              : undefined
          }
          iconColor="text-emerald-500"
          iconBgColor="bg-emerald-500/10"
        />
      </div>

      <StatusLineChart data={report?.statusTimeseries} isLoading={isLoading} />

      <InternalErrorsTable
        internalErrors={report?.internalErrors}
        isLoading={isLoading}
      />
    </div>
  );
}
