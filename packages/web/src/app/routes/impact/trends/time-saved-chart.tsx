import { PlatformAnalyticsReport } from '@activepieces/shared';
import { t } from 'i18next';
import { Clock } from 'lucide-react';

import { formatUtils } from '@/lib/format-utils';

import { impactRunsUtils } from '../lib/impact-runs-utils';

import { AnalyticsAreaChart } from './analytics-area-chart';

type TimeSavedChartProps = {
  report?: PlatformAnalyticsReport;
};

export function TimeSavedChart({ report }: TimeSavedChartProps) {
  const chartData = report
    ? impactRunsUtils
        .secondsSavedByDay(report)
        .map(({ date, value }) => ({ date, hoursSaved: value / 3600 }))
    : [];

  return (
    <AnalyticsAreaChart
      title={t('Time saved per day')}
      subtitle={t('The hours your flows gave back, day by day.')}
      tooltipLabel={t('Time saved')}
      dataKey="hoursSaved"
      color="var(--swatch-8-mark)"
      gradientId="fillTimeSaved"
      chartData={chartData}
      isLoading={!report}
      emptyIcon={<Clock />}
      emptyText={t(
        'No time saved yet. Data will appear here once your flows start running.',
      )}
      downloadFilename="time-saved"
      yAxisFormatter={(hours) =>
        hours === 0 ? '0' : formatUtils.formatToHoursAndMinutes(hours * 3600)
      }
      tooltipFormatter={(hours) =>
        formatUtils.formatToHoursAndMinutes(hours * 3600)
      }
    />
  );
}
