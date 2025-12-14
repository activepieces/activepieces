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
      title={t('Active Automations')}
      value={report.activeFlows.toLocaleString()}
      description={t(
        'Workflows running 24/7, eliminating repetitive manual tasks and reducing human error across your organization.',
      )}
      subtitle={t('{total} total workflows created', {
        total: report.totalFlows.toLocaleString(),
      })}
      iconColor="text-cyan-600"
    />
  );
};
