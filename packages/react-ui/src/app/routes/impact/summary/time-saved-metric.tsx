import { t } from 'i18next';
import { Clock } from 'lucide-react';

import { formatUtils } from '@/lib/utils';
import { PlatformAnalyticsReport } from '@activepieces/shared';

import { MetricCard, MetricCardSkeleton } from './metric-card';

type TimeSavedMetricProps = {
  report?: PlatformAnalyticsReport;
  isLoading: boolean;
};

export const TimeSavedMetric = ({
  report,
  isLoading,
}: TimeSavedMetricProps) => {
  const flows = report?.flows ?? [];

  const flowsWithTimeSaved = flows.filter(
    (flow) =>
      flow.timeSavedPerRun !== null &&
      flow.timeSavedPerRun !== undefined &&
      flow.timeSavedPerRun !== 0,
  );
  const atLeastOneTimeSavedSet = flowsWithTimeSaved.length > 0;

  const minutesSaved = atLeastOneTimeSavedSet
    ? flowsWithTimeSaved.reduce((acc, flow) => {
        const totalRuns =
          report?.runs
            .filter((run) => run.flowId === flow.flowId)
            .reduce((sum, run) => sum + (run.runs ?? 0), 0) ?? 0;
        return acc + (flow.timeSavedPerRun ?? 0) * totalRuns;
      }, 0)
    : 0;
  const equivalentWorkdays = Math.round(minutesSaved / 8 / 60);

  if (isLoading) {
    return <MetricCardSkeleton />;
  }

  if (!atLeastOneTimeSavedSet) {
    return (
      <MetricCard
        icon={Clock}
        title={t('Time Saved')}
        value="N/A"
        description={t(
          'Estimated hours saved through automation in the last 3 months. Each automated task saves valuable employee time that can be redirected to high-impact work.',
        )}
        subtitle={t('Equivalent to {days} workdays saved', {
          days: 'N/A',
        })}
        iconColor="text-emerald-600"
      />
    );
  }

  return (
    <MetricCard
      icon={Clock}
      title={t('Time Saved')}
      value={formatUtils.formatToHoursAndMinutes(minutesSaved)}
      description={t(
        'Estimated hours saved through automation in the last 3 months. Each automated task saves valuable employee time that can be redirected to high-impact work.',
      )}
      subtitle={t('Equivalent to {days} workdays saved', {
        days: equivalentWorkdays.toLocaleString(),
      })}
      iconColor="text-emerald-600"
    />
  );
};
