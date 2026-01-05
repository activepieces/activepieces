import dayjs from 'dayjs';
import { t } from 'i18next';
import * as React from 'react';
import { DateRange } from 'react-day-picker';

import { DateTimePickerWithRange } from '@/components/ui/date-time-picker-range';
import { PlatformAnalyticsReport } from '@activepieces/shared';

import { RunsChart } from './runs-chart';
import { TimeSavedChart } from './time-saved-chart';

type TrendsProps = {
  report?: PlatformAnalyticsReport;
};

export function Trends({ report }: TrendsProps) {
  const [selectedDateRange, setSelectedDateRange] = React.useState<
    DateRange | undefined
  >({
    from: dayjs().subtract(3, 'months').toDate(),
    to: dayjs().toDate(),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{t('Trends')}</div>
        <DateTimePickerWithRange
          onChange={setSelectedDateRange}
          from={selectedDateRange?.from?.toISOString()}
          to={selectedDateRange?.to?.toISOString()}
          maxDate={new Date()}
          presetType="past"
        />
      </div>
      <div className="mt-4 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RunsChart report={report} selectedDateRange={selectedDateRange} />
          <TimeSavedChart
            report={report}
            selectedDateRange={selectedDateRange}
          />
        </div>
      </div>
    </div>
  );
}
