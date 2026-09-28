import { FlowStatus, PlatformAnalyticsReport } from '@activepieces/shared';
import { WorkflowSquare02Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

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
      icon={WorkflowSquare02Icon}
      title={t('Active Flows')}
      value={activeFlows.toLocaleString()}
      description={t('Number of currently active flows')}
      subtitle={t('{total} total flows created', {
        total: totalFlows.toLocaleString(),
      })}
      iconColor="text-swatch-1-mark"
      iconBgColor="bg-swatch-1-surface"
    />
  );
};
