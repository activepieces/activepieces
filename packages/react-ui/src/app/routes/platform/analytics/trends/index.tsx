import { t } from 'i18next';

import { PlatformAnalyticsReport } from '@activepieces/shared';

import { RunsChart } from './runs-chart';
import { TimeSavedChart } from './time-saved-chart';

type TrendsProps = {
  report?: PlatformAnalyticsReport;
};

export function Trends({ report }: TrendsProps) {
  return (
    <div>
      <div className="text-lg font-semibold">{t('Trends')}</div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <RunsChart report={report} />
        <TimeSavedChart report={report} />
      </div>
    </div>
  );
}
