import { PlatformAnalyticsReport } from '@activepieces/shared';
import { t } from 'i18next';
import { Clock } from 'lucide-react';

import { formatUtils } from '@/lib/utils';

import { AnalyticsAreaChart } from './analytics-area-chart';

type TimeSavedChartProps = {
  report?: PlatformAnalyticsReport;
};

export function TimeSavedChart({ report }: TimeSavedChartProps) {
  const chartData =
    report?.runs
      .map((data) => ({
        date: data.day,
        minutesSaved:
          (report?.flows.find((flow) => flow.flowId === data.flowId)
            ?.timeSavedPerRun ?? 0) * data.runs,
      }))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) ?? [];

  return (
    <AnalyticsAreaChart
      title={t('Time Saved Over Time')}
      subtitle={t('Track how much time your automations are saving')}
      tooltipLabel={t('Time Saved')}
      dataKey="minutesSaved"
      color="#10b981"
      gradientId="fillTimeSaved"
      chartData={chartData}
      isLoading={!report}
      emptyIcon={<Clock className="h-10 w-10 text-muted-foreground/50" />}
      emptyText={t(
        'No time saved yet. Data will appear here once your flows start running.',
      )}
      downloadFilename="time-saved"
      yAxisFormatter={(v) => formatUtils.formatToHoursAndMinutes(v)}
      tooltipFormatter={(v) => formatUtils.formatToHoursAndMinutes(v)}
    />
  );
}
