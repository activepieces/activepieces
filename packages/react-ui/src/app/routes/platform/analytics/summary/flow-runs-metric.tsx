import { t } from 'i18next';
import { Zap } from 'lucide-react';

import { PlatformAnalyticsReport } from '@activepieces/shared';

import { MetricCard, MetricCardSkeleton } from './metric-card';

type FlowRunsMetricProps = {
  report?: PlatformAnalyticsReport;
};

export const FlowRunsMetric = ({ report }: FlowRunsMetricProps) => {
  if (!report) {
    return <MetricCardSkeleton />;
  }

  const totalRuns = report.runsUsage.reduce(
    (sum, item) => sum + item.totalRuns,
    0,
  );

  return (
    <MetricCard
      icon={Zap}
      title={t('Tasks Automated')}
      value={totalRuns.toLocaleString()}
      description={t(
        'Total flow runs executed. Each run represents a task completed without manual intervention, directly contributing to operational efficiency.',
      )}
      subtitle={t('')}
      iconColor="text-amber-600"
    />
  );
};
