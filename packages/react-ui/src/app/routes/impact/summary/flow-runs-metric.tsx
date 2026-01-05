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

  const totalFlowRuns = report.flowsDetails.reduce(
    (acc, flow) => acc + flow.runs,
    0,
  );

  return (
    <MetricCard
      icon={Zap}
      title={t('Automation Runs')}
      value={totalFlowRuns.toLocaleString()}
      description={t(
        'Total flow runs completed automatically, showing how many tasks your team automated in the last 3 months.',
      )}
      subtitle={t('')}
      iconColor="text-amber-600"
    />
  );
};
