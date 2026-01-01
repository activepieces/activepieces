import { t } from 'i18next';

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
    <div>
      <div className="text-lg font-semibold">{t('Summary')}</div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TimeSavedMetric isLoading={isLoading} report={report} />
        <ActiveFlowsMetric report={report} />
        <ActiveUsersMetric report={report} />
        <FlowRunsMetric report={report} />
      </div>
    </div>
  );
}
