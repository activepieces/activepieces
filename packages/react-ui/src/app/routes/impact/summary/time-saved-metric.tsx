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
  const minutesSaved =
    report?.flowsDetails.reduce((acc, flow) => acc + flow.minutesSaved, 0) ?? 0;
  const equivalentWorkdays = Math.round(minutesSaved / 8 / 60);

  if (isLoading) {
    return <MetricCardSkeleton />;
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
