import { t } from 'i18next';
import { Workflow } from 'lucide-react';

import { FlowStatus, PlatformAnalyticsReport } from '@activepieces/shared';

import { MetricCard, MetricCardSkeleton } from './metric-card';

type ActiveFlowsMetricProps = {
  report?: PlatformAnalyticsReport;
};

export const ActiveFlowsMetric = ({ report }: ActiveFlowsMetricProps) => {
  if (!report) {
    return <MetricCardSkeleton />;
  }

  const activeFlows = report.flowsDetails.filter(
    (flow) => flow.status === FlowStatus.ENABLED,
  ).length;
  const totalFlows = report.flowsDetails.length;

  return (
    <MetricCard
      icon={Workflow}
      title={t('Active Flows')}
      value={activeFlows.toLocaleString()}
      description={t(
        'Flows running 24/7, eliminating repetitive manual tasks and reducing human error across your organization.',
      )}
      subtitle={t('{total} total flows created', {
        total: totalFlows.toLocaleString(),
      })}
      iconColor="text-cyan-600"
    />
  );
};
