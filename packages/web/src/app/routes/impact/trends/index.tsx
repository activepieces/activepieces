import { PlatformAnalyticsReport } from '@activepieces/shared';

import { RunsChart } from './runs-chart';
import { TimeSavedBreakdownChart } from './time-saved-breakdown-chart';
import { TimeSavedChart } from './time-saved-chart';

type TrendsProps = {
  report?: PlatformAnalyticsReport;
};

export function Trends({ report }: TrendsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <div className="min-w-0 xl:col-span-3">
        <RunsChart report={report} />
      </div>
      <div className="min-w-0 xl:col-span-2">
        <TimeSavedBreakdownChart report={report} />
      </div>
      <div className="min-w-0 xl:col-span-5">
        <TimeSavedChart report={report} />
      </div>
    </div>
  );
}
