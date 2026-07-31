import { PlatformAnalyticsReport } from '@activepieces/shared';
import { t } from 'i18next';
import { Zap } from 'lucide-react';

import { impactRunsUtils } from '../lib/impact-runs-utils';

import { MetricCard, MetricCardSkeleton } from './metric-card';

type FlowRunsMetricProps = {
  report?: PlatformAnalyticsReport;
};

export const FlowRunsMetric = ({ report }: FlowRunsMetricProps) => {
  if (!report) {
    return <MetricCardSkeleton />;
  }

  const runsByFlow = impactRunsUtils.sumRunsByFlow(report.runs);
  const totalFlowRuns = report.flows.reduce(
    (acc, flow) => acc + (runsByFlow.get(flow.flowId) ?? 0),
    0,
  );

  return (
    <MetricCard
      icon={Zap}
      title={t('Automation Runs')}
      value={totalFlowRuns.toLocaleString()}
      description={t('Total automation executions')}
      iconColor="text-rose-500"
      iconBgColor="bg-rose-500/10"
    />
  );
};
