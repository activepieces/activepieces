import { FlowStatus, PlatformAnalyticsReport } from '@activepieces/shared';
import { t } from 'i18next';
import { Workflow } from 'lucide-react';

import { MetricCard, MetricCardSkeleton } from './metric-card';

type ActiveFlowsMetricProps = {
  report?: PlatformAnalyticsReport;
};

export const ActiveFlowsMetric = ({ report }: ActiveFlowsMetricProps) => {
  if (!report) {
    return <MetricCardSkeleton />;
  }

  const activeFlows = report.flows.filter(
    (flow) => flow.status === FlowStatus.ENABLED,
  ).length;
  const totalFlows = report.flows.length;

  return (
    <MetricCard
      icon={Workflow}
      title={t('Active Flows')}
      value={activeFlows.toLocaleString()}
      description={t('Number of currently active flows')}
      subtitle={t('{total} total flows created', {
        total: totalFlows.toLocaleString(),
      })}
      iconColor="text-purple-500"
      iconBgColor="bg-purple-500/10"
    />
  );
};
