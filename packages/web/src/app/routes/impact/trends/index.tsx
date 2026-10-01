import { PlatformAnalyticsReport } from '@activepieces/shared';

import { RunsChart } from './runs-chart';
import { TimeSavedChart } from './time-saved-chart';

type TrendsProps = {
  report?: PlatformAnalyticsReport;
};

export function Trends({ report }: TrendsProps) {
  return (
    <div className="flex flex-col gap-4">
      <RunsChart report={report} />
      <TimeSavedChart report={report} />
    </div>
  );
}
