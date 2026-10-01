import { PlatformAnalyticsReport } from '@activepieces/shared';

import { ActiveFlowsMetric } from './active-flows-metric';
import { ActiveUsersMetric } from './active-users-metric';
import { FlowRunsMetric } from './flow-runs-metric';
import { TimeSavedMetric } from './time-saved-metric';

type SummaryProps = {
  report?: PlatformAnalyticsReport;
};

export function Summary({ report }: SummaryProps) {
  const isLoading = !report;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <TimeSavedMetric isLoading={isLoading} report={report} />
      <ActiveFlowsMetric report={report} />
      <ActiveUsersMetric report={report} />
      <FlowRunsMetric report={report} />
    </div>
  );
}
