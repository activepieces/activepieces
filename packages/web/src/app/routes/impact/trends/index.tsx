import { PlatformAnalyticsReport } from '@activepieces/shared';
import { t } from 'i18next';

import { RunsChart } from './runs-chart';
import { TimeSavedChart } from './time-saved-chart';

type TrendsProps = {
  report?: PlatformAnalyticsReport;
};

export function Trends({ report }: TrendsProps) {
  return (
    <div className="space-y-6 mb-6">
      <RunsChart report={report} />
      <TimeSavedChart report={report} />
    </div>
  );
}
