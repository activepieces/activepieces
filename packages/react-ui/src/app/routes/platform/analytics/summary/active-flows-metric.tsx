import { t } from 'i18next';
import { Workflow } from 'lucide-react';

import { PlatformAnalyticsReport } from '@activepieces/shared';

import { MetricCard, MetricCardSkeleton } from './metric-card';

type ActiveFlowsMetricProps = {
  report?: PlatformAnalyticsReport;
};

export const ActiveFlowsMetric = ({ report }: ActiveFlowsMetricProps) => {
  if (!report) {
    return <MetricCardSkeleton />;
  }

  return (
    <MetricCard
      icon={Workflow}
      title={t('Active Flows')}
      value={report.activeFlows.toLocaleString()}
      description={t(
        'Flows running 24/7, eliminating repetitive manual tasks and reducing human error across your organization.',
      )}
      subtitle={t('{total} total flows created', {
        total: report.totalFlows.toLocaleString(),
      })}
      iconColor="text-cyan-600"
    />
  );
};
