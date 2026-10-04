import { PlatformMetricsHealthDay } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { DayBar, DayBars } from '@/components/custom/day-bars';
import { listFormat } from '@/components/custom/list/list-format';
import { Panel } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { healthMetricsQueries } from '../lib/health-metrics-hooks';

export function DailyHealthStrip() {
  const { data, isLoading, isError, refetch } =
    healthMetricsQueries.useHealthHistory();
  const days = data?.days ?? [];
  const unhealthy = days.filter((day) => !isHealthy(day)).length;

  return (
    <Panel
      title={t('Last 30 days')}
      description={
        isLoading || isError
          ? t(
              'A day is green when no run hit an internal error and no job got stuck.',
            )
          : unhealthy === 0
          ? t('Every day was clean: no internal errors and no stuck jobs.')
          : t(
              '{count, plural, =1 {# day had} other {# days had}} internal errors or stuck jobs. Hover a bar for details.',
              { count: unhealthy },
            )
      }
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/platform/health/runs">
            {t('See runs')}
            <ArrowRight />
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-8 w-full rounded-xl" />
      ) : isError ? (
        <DataFetchErrorState
          entity={t('daily health')}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="flex flex-col gap-2">
          <DayBars days={days.map(toDayBar)} />
          <div className="flex justify-between text-xs text-gray-11">
            <span>{t('30 days ago')}</span>
            <span>{t('Today')}</span>
          </div>
        </div>
      )}
    </Panel>
  );
}

function toDayBar(day: PlatformMetricsHealthDay): DayBar {
  const healthy = isHealthy(day);
  return {
    key: day.day,
    tone: healthy ? 'success' : 'danger',
    label: (
      <div className="flex min-w-48 flex-col gap-1">
        <span className="font-medium">{listFormat.fullDate(day.day)}</span>
        {healthy ? (
          <span>{t('No internal errors or stuck jobs')}</span>
        ) : (
          <>
            <TooltipFigure
              label={t('Internal errors')}
              value={day.internalErrors}
            />
            <TooltipFigure
              label={t('Affected flows')}
              value={day.affectedFlows}
            />
            <TooltipFigure label={t('Stuck jobs')} value={day.stuckJobs} />
          </>
        )}
      </div>
    ),
  };
}

function TooltipFigure({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center justify-between gap-6">
      <span>{label}</span>
      <span className="font-medium tabular-nums">
        {listFormat.count(value)}
      </span>
    </span>
  );
}

function isHealthy(day: PlatformMetricsHealthDay): boolean {
  return day.internalErrors === 0 && day.stuckJobs === 0;
}
